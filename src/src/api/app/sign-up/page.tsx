"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithPopup, onAuthStateChanged } from "firebase/auth";
import { auth, db, googleProvider } from '@/app/lib/firebase';  // Updated path
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import Link from 'next/link';

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

export default function SignUpPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [message, setMessage] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsAuthenticated(true);
        fetchCategories();
        fetchArticles();
      }
    });

    return () => unsubscribe();
  }, [router]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Create user document in Firestore
      await setDoc(doc(db, "users", user.uid), {
        email: user.email,
        coins: 0,
        createdAt: new Date(),
      });

      router.push('/dashboard');
    } catch (error: any) { // Type assertion for error
      console.error("Error signing in: ", error);
      setMessage(error.message ? `Error: ${error.message}` : 'An error occurred');
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      // Create/update user document in Firestore
      await setDoc(doc(db, "users", user.uid), {
        email: user.email,
        coins: 0,
        createdAt: new Date(),
      }, { merge: true });

      router.push('/dashboard');
    } catch (error: any) { // Type assertion for error
      console.error("Error signing in with Google: ", error);
      setMessage(error.message ? `Error: ${error.message}` : 'An error occurred');
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

  return (
    <div>
      <h1>Sign Up</h1>
      {!isAuthenticated ? (
        <>
          <button onClick={handleGoogleSignIn}>Sign Up with Google</button>
          {message && <p>{message}</p>}
        </>
      ) : (
        <>
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
                <a href={`/articles`}>{article.title.rendered}</a>
              </li>
            ))}
          </ul>
          <a href="/dashboard">Go to Dashboard</a>
        </>
      )}
    </div>
  );
}