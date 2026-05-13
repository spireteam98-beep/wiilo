"use client";

import React from 'react';

export default function BlogPostPage() {
  return (
    <div>
      {/* Blog post content coming soon */}
    </div>
  );
}

/* Original code commented out for future use
import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

export default function BlogPostPage() {
  const [post, setPost] = useState(null);
  const params = useParams();

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/posts/${params.postId}`);
        const data = await response.json();
        setPost(data);
      } catch (error) {
        console.error('Error fetching post:', error);
      }
    };

    fetchPost();
  }, [params.postId]);

  return (
    <div>
      {post ? (
        <>
          <h1>{post.title}</h1>
          <div dangerouslySetInnerHTML={{ __html: post.content }} />
        </>
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
}
*/ 