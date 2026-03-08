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

function getApiKey(): string {
  const fromEnv = process.env.ZAPSIGN_API_KEY;
  const fallback =
    "e148c4d0-924e-43d0-850f-5c65ef383694a68aa736-0bca-4d95-83c6-5d390d091f93";
  return fromEnv && fromEnv.trim().length > 0 ? fromEnv : fallback;
}

export async function createDocument(
  payload: CreateDocPayload,
): Promise<CreateDocResponse> {
  const apiKey = getApiKey();
  const url = "https://api.zapsign.com.br/api/v1/docs/";

  try {
    console.log("ZapSign request createDocument", {
      url,
      name: payload.name,
      signersCount: payload.signers?.length ?? 0,
      hasBase64: !!payload.base64_pdf,
      apiKeyMasked: apiKey ? `${apiKey.substring(0, 6)}...${apiKey.slice(-4)}` : null,
    });
    const { data, status } = await axios.post<CreateDocResponse>(url, payload, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
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
