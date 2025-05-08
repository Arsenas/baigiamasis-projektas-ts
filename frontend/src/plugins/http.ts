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
async function postAuth<T = PostAuthResponse>(endpoint: string, data: any, token?: string): Promise<T> {
  try {
    const res = await fetch(baseUrl + endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify(data),
    });

    let result: any = null;

    try {
      result = await res.json(); // 👈 pabandome parse'inti JSON saugiai
    } catch (e) {
      console.error("❌ Failed to parse JSON response");
    }

    if (!res.ok || !result) {
      return {
        error: true,
        message: result?.message || `Server error (status ${res.status})`,
      } as T;
    }

    return result as T;
  } catch (error) {
    console.error("HTTP POST error:", error);
    return {
      error: true,
      message: "Network error",
    } as T;
  }
}

async function get(endpoint: string, token?: string): Promise<PostAuthResponse> {
  try {
    const res = await fetch(baseUrl + endpoint, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    return await res.json();
  } catch (error) {
    console.error("HTTP GET error:", error);
    return { error: true, message: "Network error" };
  }
}

export async function deleteAuth(endpoint: string, token?: string) {
  try {
    const res = await fetch(baseUrl + endpoint, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });
    if (!res.ok) {
      const err = await res.json();
      return { error: true, message: err.message || `Status ${res.status}` };
    }
    return await res.json();
  } catch (e) {
    console.error("HTTP DELETE error:", e);
    return { error: true, message: "Network error" };
  }
}

export default { postAuth, get, deleteAuth };
