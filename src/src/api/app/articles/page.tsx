"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/app/lib/firebase';
import { signInWithPopup, signOut, GoogleAuthProvider } from 'firebase/auth';

interface Category {
  id: number;
  name: string;
  slug: string;
}

interface Article {
  id: number;
  title: {
    rendered: string;
  };
}

export default function ArticlesPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [savedArticles, setSavedArticles] = useState<Article[]>([]);

  useEffect(() => {
    const user = localStorage.getItem('user');
    if (user) {
      setIsAuthenticated(true);
      fetchCategories();
      fetchArticles();
      fetchSavedArticles(); // Fetch saved articles
    } else {
      signInWithGoogle(); // Trigger Google Sign-In
    }
  }, [router]);

  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      localStorage.setItem('user', JSON.stringify(user));
      setIsAuthenticated(true);
      fetchCategories();
      fetchArticles();
      fetchSavedArticles(); // Fetch saved articles
    } catch (error) {
      console.error('Error signing in with Google:', error);
      router.push('/sign-in');
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem('user');
      setIsAuthenticated(false);
      signInWithGoogle(); // Redirect to Google Sign-In
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch('https://mohamedroyal.com/wp-json/wp/v2/categories');
      const data = await res.json();
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchArticles = async () => {
    try {
      const res = await fetch('https://mohamedroyal.com/wp-json/wp/v2/posts');
      const data = await res.json();
      setArticles(data);
    } catch (error) {
      console.error('Error fetching articles:', error);
    }
  };

  const fetchSavedArticles = async () => {
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) return;
      
      const user = JSON.parse(userStr);
      const res = await fetch(`https://mohamedroyal.com/wp-json/wp/v2/saved_articles?user_id=${user.uid}`);
      const data = await res.json();
      setSavedArticles(data);
    } catch (error) {
      console.error('Error fetching saved articles:', error);
    }
  };

  if (!isAuthenticated) return <div>Loading...</div>;

  return (
    <div>
      <h1>Articles</h1>
      <button onClick={handleLogout}>Logout</button> {/* Logout button */}
      <nav>
        <ul>
          {categories.map(category => (
            <li key={category.id}>
              <a href={`/category/${category.slug}`}>{category.name}</a>
            </li>
          ))}
        </ul>
      </nav>
      <ul>
        {articles.map(article => (
          <li key={article.id}>
            <a href={`/articles`}>{article.title.rendered}</a> {/* Updated link */}
          </li>
        ))}
      </ul>
      <h2>Your Saved Articles</h2> {/* New section for saved articles */}
      <ul>
        {savedArticles.map(article => (
          <li key={article.id}>
            <a href={`/dashboard`}>{article.title.rendered}</a> {/* Updated link */}
          </li>
        ))}
      </ul>
    </div>
  );
}
