const baseUrl = process.env.REACT_APP_API_URL + "/api";

export interface PostAuthResponse {
  error?: boolean;
  success?: boolean;
  message?: string;
  user?: any;
  updatedUser?: any;
  token?: string;
  data?: any;
}

//Post funkcija

async function postAuth(endpoint: string, data: any, token?: string): Promise<PostAuthResponse> {
  try {
    const res = await fetch(baseUrl + endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify(data),
    });

    const result = await res.json();

    if (!res.ok) {
      console.error("❌ Backend responded with error status:", res.status);
      return { error: true, message: result.message || "Server responded with an error" };
    }

    return result;
  } catch (error) {
    console.error("HTTP POST error:", error);
    return { error: true, message: "Network error" };
  }
}

async function get(endpoint: string, token?: string): Promise<PostAuthResponse> {
  try {
    const res = await fetch(baseUrl + endpoint, {
      method: "GET",
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    return await res.json();
  } catch (error) {
    console.error("HTTP GET error:", error);
    return { error: true, message: "Network error" };
  }
}

export default { postAuth, get };
