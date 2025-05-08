const baseUrl = process.env.REACT_APP_API_URL + "/api";

export interface PostAuthResponse {
  error?: boolean;
  success?: boolean;
  message?: string;
  user?: any;
  updatedUser?: any;
  deleted?: boolean;
  token?: string;
  data?: any;
}

export type ApiResponse<T = any> = {
  error?: boolean;
  message?: string;
  data?: T;
};

// POST
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

    const result = await safeJson(res);

    if (!res.ok || !result) {
      return {
        error: true,
        message: result?.message || `Server error (status ${res.status})`,
      } as T;
    }

    return result as T;
  } catch (error) {
    console.error("HTTP POST error:", error);
    return { error: true, message: "Network error" } as T;
  }
}

// GET
async function get<T = PostAuthResponse>(endpoint: string, token?: string): Promise<T> {
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
    return { error: true, message: "Network error" } as T;
  }
}

// DELETE
async function del<T = PostAuthResponse>(endpoint: string, token?: string): Promise<T> {
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
      return {
        error: true,
        message: err.message || `Status ${res.status}`,
      } as T;
    }

    return await res.json();
  } catch (e) {
    console.error("HTTP DELETE error:", e);
    return { error: true, message: "Network error" } as T;
  }
}

// 👇 saugus JSON parse
async function safeJson(res: Response) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

export default {
  postAuth,
  get,
  del,
  delete: del, // 👈 leidžia naudoti http.delete(...) be TypeScript klaidos
};
