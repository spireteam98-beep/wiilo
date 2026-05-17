'use client';

import './newsfeed.css';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tweet } from '@/components/tweet';
import {
  ImageIcon,
  FileText,
  BarChart2,
  Smile,
  CalendarClock,
  MapPin,
} from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase-client';
import { useUser } from '@/firebase';
import { toast } from 'react-hot-toast';
import { Header } from '@/components/Header';

interface TweetData {
  id: number;
  author: string;
  username: string;
  created_at: string;
  content: string;
  avatar: string;
  reply_count: number;
  retweet_count: number;
  like_count: number;
  view_count: string;
  politicianAvatar?: string; // small avatar
  handler?: string;
  handlerDate?: string;
}

export default function NewsfeedPage() {
  const { user, loading: userLoading } = useUser();
  const [newTweet, setNewTweet] = useState('');
  const [tweets, setTweets] = useState<TweetData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTweets = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('tweets')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      setError('Could not fetch tweets.');
    } else {
      setTweets(data as TweetData[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchTweets();

    const channel = supabase
      .channel('realtime tweets')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'tweets' },
        (payload) => {
          setTweets((current) => [payload.new as TweetData, ...current]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchTweets]);

  const handleTweet = async () => {
    if (!newTweet.trim() || userLoading) return;

    const payload = {
      author: user?.displayName || 'Anonymous',
      username: user?.email
        ? `@${user.email.split('@')[0]}`
        : `@guest${Math.floor(Math.random() * 10000)}`,
      content: newTweet,
      avatar: user?.photoURL || '/pictures/Host.jpg',
      reply_count: 0,
      retweet_count: 0,
      like_count: 0,
      view_count: '0',
      politicianAvatar: '/pictures/Host.jpg',
      handler: 'Iscasilaad',
      handlerDate: 'Mar 31',
    };

    const { error } = await supabase.from('tweets').insert([payload]);

    if (error) {
      toast.error('Failed to post');
    } else {
      setNewTweet('');
      toast.success('Posted');
    }
  };

  const formattedTweets = tweets.map((tweet) => ({
    id: tweet.id,
    author: tweet.author,
    username: tweet.username,
    date: new Date(tweet.created_at).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    }),
    content: tweet.content,
    avatar: tweet.avatar,
    replyCount: tweet.reply_count,
    retweetCount: tweet.retweet_count,
    likeCount: tweet.like_count,
    viewCount: tweet.view_count,
    politicianAvatar: tweet.politicianAvatar || '/pictures/Host.jpg',
    handler: tweet.handler || 'Iscasilaad',
    handlerDate: tweet.handlerDate || 'Mar 31',
  }));

  return (
    <div className="min-h-screen bg-black text-white font-sans">
      <Header className="sticky top-0 z-50 border-b border-zinc-800/80 bg-black/80 backdrop-blur-xl px-4 py-3">
        <h1 className="text-xl font-extrabold tracking-tight">Home</h1>
      </Header>

      <main className="mx-auto min-h-screen max-w-2xl border-x border-zinc-800">
        <section className="border-b border-zinc-800 px-4 py-4">
          <div className="flex gap-3">
            <Avatar className="h-11 w-11 rounded-md ring-1 ring-zinc-800">
              <AvatarImage
                src={user?.photoURL || '/icons/run icon.ico'}
                alt={user?.displayName || 'User avatar'}
              />
              <AvatarFallback className="rounded-md">
                {user?.displayName?.charAt(0) || 'G'}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1">
              <Textarea
                placeholder="What is happening?"
                value={newTweet}
                onChange={(e) => setNewTweet(e.target.value)}
                disabled={userLoading}
                className="min-h-[120px] resize-none border-none bg-transparent px-0 text-[22px] leading-8 text-white placeholder:text-zinc-500 focus-visible:ring-0"
              />

              <div className="mt-3 flex items-center justify-between border-t border-zinc-800 pt-3">
                <div className="flex items-center gap-4 text-[#1d9bf0]">
                  {[ImageIcon, FileText, BarChart2, Smile, CalendarClock, MapPin].map(
                    (Icon, i) => (
                      <button
                        key={i}
                        className="rounded-full p-2 transition hover:bg-[#1d9bf0]/10"
                        type="button"
                      >
                        <Icon size={18} />
                      </button>
                    )
                  )}
                </div>

                <Button
                  onClick={handleTweet}
                  disabled={userLoading || !newTweet.trim()}
                  className="rounded-full bg-[#1d9bf0] px-6 font-bold text-white hover:bg-[#1a8cd8]"
                >
                  Post
                </Button>
              </div>
            </div>
          </div>
        </section>

        {loading && (
          <div className="p-6 text-center text-zinc-400">Loading posts...</div>
        )}

        {error && (
          <div className="p-6 text-center text-red-500">{error}</div>
        )}

        {!loading && !error && (
          <section>
            {formattedTweets.map((tweet) => (
              <div
                key={tweet.id}
                className="flex border-b border-zinc-800 px-4 py-4 gap-3"
              >
                {/* Main avatar */}
                <Avatar className="h-11 w-11 ring-1 ring-zinc-800">
                  <AvatarImage src={tweet.avatar} alt={tweet.author} />
                  <AvatarFallback>{tweet.author.charAt(0)}</AvatarFallback>
                </Avatar>

                <div className="flex-1">
                  {/* Top line: Author name + handler + date + small politician avatar */}
                  <div className="flex items-center gap-2">
                    <h2 className="font-bold">{tweet.author}</h2>

                    <span className="text-zinc-500 flex items-center gap-1">
                      @{tweet.handler} · {tweet.handlerDate}

                      {/* Small rounded avatar for politician displayed AFTER handler/date */}
                      <Avatar className="h-5 w-5 rounded-full ml-2">
                        <AvatarImage src={tweet.politicianAvatar} alt="Politician" />
                        <AvatarFallback>P</AvatarFallback>
                      </Avatar>
                    </span>
                  </div>

                  {/* Story content */}
                  <p className="mt-1 text-white leading-6">{tweet.content}</p>

                  {/* Action icons */}
                  <div className="mt-3 flex items-center gap-6 text-zinc-400">
                    <button type="button" className="p-1 hover:text-[#1d9bf0]">
                      <ImageIcon size={16} />
                    </button>
                    <button type="button" className="p-1 hover:text-[#1d9bf0]">
                      <FileText size={16} />
                    </button>
                    <button type="button" className="p-1 hover:text-[#1d9bf0]">
                      <BarChart2 size={16} />
                    </button>
                    <button type="button" className="p-1 hover:text-[#1d9bf0]">
                      <Smile size={16} />
                    </button>
                    <button type="button" className="p-1 hover:text-[#1d9bf0]">
                      <CalendarClock size={16} />
                    </button>
                    <button type="button" className="p-1 hover:text-[#1d9bf0]">
                      <MapPin size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </section>
        )}
      </main>
    </div>
  );
}