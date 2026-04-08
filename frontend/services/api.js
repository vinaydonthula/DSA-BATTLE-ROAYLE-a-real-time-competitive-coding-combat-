const API_BASE = process.env.NEXT_PUBLIC_API_URL;

/* ---------------- HELPERS ---------------- */

async function request(url, options = {}) {
  let token = null;
  if (typeof window !== "undefined") {
    token = localStorage.getItem("userToken");
  }

  const res = await fetch(`${API_BASE}${url}`, {
    credentials: 'include', // cookies are sent automatically
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    },
    ...options,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || 'API Error');
  }

  return res.json();
}


export const authAPI = {
  login: async ({ email, password }) => {
    return request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  register: async ({ username, email, password }) => {
    return request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password }),
    });
  },

  me: async () => {
    return request('/api/auth/me');
  },

  logout: async () => {
    return request('/api/auth/logout', {
      method: 'POST',
    });
  },
};


export const analyticsAPI = {
  getUserStats: async () => {
    return request('/api/analytics/dashboard');
  },
};

export const leaderboardAPI = {
  getGlobal: async () => {
    return request('/api/leaderboard/global');
  },
};

export const duelAPI = {
  join: async (difficulty) => {
    return request('/api/duel/join', {
      method: 'POST',
      body: JSON.stringify({ difficulty }),
    });
  },
};

export const matchAPI = {
  getMatch: async (matchId) => {
    const res = await fetch(
      `${API_BASE}/api/matches/${matchId}`,
      { credentials: "include" }
    );

    if (!res.ok) {
      throw new Error("Failed to fetch match");
    }

    return res.json();
  },
};

export const submissionAPI = {
  submit: async ({ matchId, code, language }) => {
    return request('/api/submissions', {
      method: 'POST',
      body: JSON.stringify({ matchId, code, language }),
    });
  },
};

export const executeAPI = {
  run: async ({ code, language, input }) => {
    return request('/api/run', {
      method: 'POST',
      body: JSON.stringify({ code, language, input }),
    });
  },
  submit: async ({ code, language, problemId }) => {
    return request('/api/submit', {
      method: 'POST',
      body: JSON.stringify({ code, language, problemId }),
    });
  }
};

export const contestAPI = {
  create: async (formData) => {
    return request('/api/contests', {
      method: 'POST',
      body: JSON.stringify(formData),
    });
  },

  join: async (contestId) => {
    return request(`/api/contests/${contestId}/join`, {
      method: 'POST',
    });
  },

  get: async (contestId) => {
    return request(`/api/contests/${contestId}`);
  },
};

export const userAPI = {
  updateProfile: async (formData) => {
    return request('/api/users/profile', {
      method: 'PUT',
      body: JSON.stringify(formData),
    });
  },
};

export const adminAPI = {
  login: async ({ email, password }) => {
    const res = await fetch(`${API_BASE}/api/admin/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Admin login failed");
    }

    return res.json(); // { token, role }
  },

  me: async () => {
    const token = localStorage.getItem("adminToken");

    const res = await fetch(`${API_BASE}/api/admin/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      throw new Error("Unauthorized");
    }

    return res.json();
  },

  logout: () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminRole");
  },

  getProblems: async () => {
    const token = localStorage.getItem("adminToken");
    const res = await fetch(`${API_BASE}/api/admin/problems`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      throw new Error("Failed to fetch problems");
    }

    return res.json();
  },

  createProblem: async (problemData) => {
    const token = localStorage.getItem("adminToken");
    const res = await fetch(`${API_BASE}/api/admin/problems`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(problemData),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Failed to create problem");
    }

    return res.json();
  },

  updateProblem: async (id, problemData) => {
    const token = localStorage.getItem("adminToken");
    const res = await fetch(`${API_BASE}/api/admin/problems/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(problemData),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Failed to update problem");
    }

    return res.json();
  },

  deleteProblem: async (id) => {
    const token = localStorage.getItem("adminToken");
    const res = await fetch(`${API_BASE}/api/admin/problems/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      throw new Error("Failed to delete problem");
    }

    return res.json();
  },
};


