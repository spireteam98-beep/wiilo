const BASE_URL = "https://mohamedroyal.com/wp-json/wp/v2";

// Simple cache utility
const cache = {};

// Fetch all articles
export const getArticles = async (page = 1, perPage = 10) => {
  const cacheKey = `articles_page_${page}`;
  if (cache[cacheKey]) {
    return cache[cacheKey];
  }

  try {
    const response = await fetch(`${BASE_URL}/posts?_embed&page=${page}&per_page=${perPage}`);
    if (!response.ok) {
      throw new Error("Failed to fetch articles");
    }
    const articles = await response.json();

    cache[cacheKey] = articles.map((article) => ({
      slug: article.slug,
      title: article.title.rendered,
      excerpt: article.excerpt.rendered.replace(/(<([^>]+)>)/gi, ""),
      content: article.content.rendered,
      featuredImage: article._embedded?.["wp:featuredmedia"]?.[0]?.source_url || null,
    }));

    return cache[cacheKey];
  } catch (error) {
    console.error("Error fetching articles:", error);
    return [];
  }
};

// Fetch a single article by slug
export const getArticlesBySlug = async (slug) => {
  const cacheKey = `article_slug_${slug}`;
  if (cache[cacheKey]) {
    return cache[cacheKey];
  }

  try {
    const response = await fetch(`${BASE_URL}/posts?slug=${slug}&_embed`);
    if (!response.ok) {
      throw new Error("Failed to fetch article");
    }
    const articles = await response.json();
    if (articles.length === 0) {
      return null;
    }
    const article = articles[0];
    const formattedArticle = {
      slug: article.slug,
      title: article.title.rendered,
      excerpt: article.excerpt.rendered.replace(/(<([^>]+)>)/gi, ""),
      content: article.content.rendered,
      featuredImage: article._embedded?.["wp:featuredmedia"]?.[0]?.source_url || null,
    };
    cache[cacheKey] = formattedArticle;
    return formattedArticle;
  } catch (error) {
    console.error("Error fetching article:", error);
    return null;
  }
};

// Fetch categories
export const getCategories = async () => {
  const cacheKey = `categories`;
  if (cache[cacheKey]) {
    return cache[cacheKey];
  }

  try {
    const response = await fetch(`${BASE_URL}/categories`);
    if (!response.ok) {
      throw new Error("Failed to fetch categories");
    }
    const categories = await response.json();
    const formattedCategories = categories.map((category) => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
    }));
    cache[cacheKey] = formattedCategories;
    return formattedCategories;
  } catch (error) {
    console.error("Error fetching categories:", error);
    return [];
  }
};

// NEW: Get user profile details
export const getUserProfile = async (userId) => {
  const cacheKey = `user_profile_${userId}`;
  if (cache[cacheKey]) {
    return cache[cacheKey];
  }

  try {
    const response = await fetch(`${BASE_URL}/users/${userId}`);
    if (!response.ok) {
      throw new Error("Failed to fetch user profile");
    }
    const profile = await response.json();
    const formattedProfile = {
      id: profile.id,
      name: profile.name,
      email: profile.email,
      profilePicture: profile.avatar_urls?.['96'] || null,
      phone: profile.meta?.phone || null, // Assuming phone is stored in user meta
      walletBalance: profile.meta?.wallet_balance || 0.00, // Assuming wallet balance is stored in user meta
    };
    cache[cacheKey] = formattedProfile;
    return formattedProfile;
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return null;
  }
};

// NEW: Update user profile
export const updateUserProfile = async (userId, updatedData) => {
  try {
    const response = await fetch(`${BASE_URL}/users/${userId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem('userToken')}` // Assuming you're using a token for authentication
      },
      body: JSON.stringify(updatedData),
    });
    if (!response.ok) {
      throw new Error("Failed to update user profile");
    }
    const updatedProfile = await response.json();
    // Update cache if needed
    const cacheKey = `user_profile_${userId}`;
    cache[cacheKey] = updatedProfile;
    return updatedProfile;
  } catch (error) {
    console.error("Error updating user profile:", error);
    return null;
  }
};

// NEW: Top-up user's wallet
export const topUpWallet = async (userId, amount) => {
  try {
    const response = await fetch(`${BASE_URL}/users/${userId}/top-up-wallet`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem('userToken')}` // Assuming you're using a token for authentication
      },
      body: JSON.stringify({ amount }),
    });
    if (!response.ok) {
      throw new Error("Failed to top-up wallet");
    }
    const updatedProfile = await response.json();
    // Update cache if needed
    const cacheKey = `user_profile_${userId}`;
    if (cache[cacheKey]) {
      cache[cacheKey].walletBalance = updatedProfile.wallet_balance;
    }
    return updatedProfile.wallet_balance; // Returning the updated wallet balance
  } catch (error) {
    console.error("Error top-up wallet:", error);
    return null;
  }
};

// NEW: Handle user activities like save, like, share, etc.
export const updateUserActivity = async (userId, activityType, articleId) => {
  try {
    const response = await fetch(`${BASE_URL}/users/${userId}/activity`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem('userToken')}` // Assuming you're using a token for authentication
      },
      body: JSON.stringify({ activityType, articleId }),
    });
    if (!response.ok) {
      throw new Error("Failed to record user activity");
    }
    const updatedActivity = await response.json();
    return updatedActivity;
  } catch (error) {
    console.error("Error updating user activity:", error);
    return null;
  }
};
