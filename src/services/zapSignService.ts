import axios from "axios";

type CreateDocResponseSigner = {
  token: string;
  status: "new" | "link-opened" | "signed";
  name?: string;
  email?: string;
  phone_country?: string;
  phone_number?: string;
  signed_at?: string | null;
};

type CreateDocResponse = {
  token: string;
  status: "pending" | "signed";
  name: string;
  signers: CreateDocResponseSigner[];
  created_at?: string;
};

export type CreateDocPayloadSigner = {
  name: string;
  email?: string;
  phone_country?: string;
  phone_number?: string;
};

export type CreateDocPayload = {
  name: string;
  base64_pdf: string;
  signers: CreateDocPayloadSigner[];
};

function cleanEnv(value: string | undefined): string {
  return (value || "").trim().replace(/^[`"' ]+|[`"' ]+$/g, "");
}

function getApiToken(): string {
  const token = cleanEnv(
    process.env.ZAPSIGN_API_TOKEN || process.env.ZAPSIGN_API_KEY,
  );
  if (!token) {
    throw new Error("ZAPSIGN_API_TOKEN (ou ZAPSIGN_API_KEY) não definido");
  }
  return token;
}

function getApiBaseUrl(): string {
  const base =
    cleanEnv(process.env.ZAPSIGN_API_URL) ||
    "https://sandbox.api.zapsign.com.br/api/v1";
  return base.replace(/\/+$/g, "");
}

export async function createDocument(
  payload: CreateDocPayload,
): Promise<CreateDocResponse> {
  const apiToken = getApiToken();
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}/docs/`;

  try {
    console.log("ZapSign request createDocument", {
      url,
      name: payload.name,
      signersCount: payload.signers?.length ?? 0,
      hasBase64: !!payload.base64_pdf,
      apiTokenMasked: apiToken
        ? `${apiToken.substring(0, 6)}...${apiToken.slice(-4)}`
        : null,
    });
    const { data, status } = await axios.post<CreateDocResponse>(url, payload, {
      headers: {
        Authorization: `Bearer ${apiToken}`,
        "Content-Type": "application/json",
      },
      timeout: 20000,
    });
    console.log("ZapSign response createDocument", { status });
    return data;
  } catch (error: any) {
    const status = error?.response?.status;
    const respData = error?.response?.data;
    console.error("ZapSign error createDocument", {
      status,
      data: respData,
      message: error?.message,
    });
    throw {
      isZapSign: true,
      status,
      data: respData,
      message: error?.message,
    };
  }
}
