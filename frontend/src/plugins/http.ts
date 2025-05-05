const baseUrl = "http://localhost:2000/api";

interface PostAuthResponse {
  error?: boolean;
  success?: boolean;
  message?: string;
  user?: any;
  token?: string;
  data?: any;
}

async function postAuth(endpoint: string, data: any, token?: string): Promise<PostAuthResponse> {
  const res = await fetch(baseUrl + endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: token || "",
    },
    body: JSON.stringify(data),
  });
  return await res.json();
}

export default { postAuth };
