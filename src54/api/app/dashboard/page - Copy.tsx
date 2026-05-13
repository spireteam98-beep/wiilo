"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '../lib/firebase';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import Image from 'next/image';
import { 
  FaArrowLeft,
  FaArrowRight,
  FaDownload,
  FaExchangeAlt,
  FaChevronLeft,
  FaUserCircle
} from 'react-icons/fa';
import { SiNetflix, SiSpotify } from 'react-icons/si';
import { GiHamburgerMenu } from 'react-icons/gi';
import styles from './Dashboard.module.css';

// Static contact data
const STATIC_CONTACTS = [
  { id: '1', name: 'Kavya', avatar: 'https://i.pravatar.cc/100?img=1' },
  { id: '2', name: 'Dhruv', avatar: 'https://i.pravatar.cc/100?img=2' },
  { id: '3', name: 'Justin', avatar: 'https://i.pravatar.cc/100?img=3' },
  { id: '4', name: 'Mithila', avatar: 'https://i.pravatar.cc/100?img=4' },
  { id: '5', name: 'Hardik', avatar: 'https://i.pravatar.cc/100?img=5' },
];

function useBalance() {
  const [userCoins, setUserCoins] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        const userRef = doc(db, 'users', user.uid);
        const balanceUnsubscribe = onSnapshot(userRef, 
          (doc) => {
            if (doc.exists()) {
              setUserCoins(doc.data().coins || 0);
            } else {
              setUserCoins(0);
            }
            setLoading(false);
          },
          (error) => {
            console.error('Error fetching balance:', error);
            setError('Failed to fetch balance');
            setLoading(false);
          }
        );

        return () => balanceUnsubscribe();
      } else {
        setUserCoins(0);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  return { userCoins, loading, error };
}

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const { userCoins, loading: balanceLoading } = useBalance();

  const mainActions = [
    { icon: <FaArrowLeft size={20} />, label: 'Transfer' },
    { icon: <FaDownload size={20} />, label: 'Deposit' },
    { icon: <FaExchangeAlt size={20} />, label: 'Swap' }
  ];

  const quickActions = [
    { label: 'Transfer' },
    { label: 'Top up' },
    { label: 'Scan' },
    { label: 'Receive' }
  ];

  const cryptoData = [
    { 
      name: 'Bitcoin',
      symbol: 'BTC',
      amount: '0.00000045',
      change: '+3.8%'
    },
    { 
      name: 'Binance',
      symbol: 'BNB',
      amount: '216.3',
      change: '+1.37%'
    },
    { 
      name: 'Adalite',
      symbol: 'ADL',
      amount: '0.4976',
      change: '+2.72%'
    }
  ];

  const contacts = [
    'Kavya', 'Dhruv', 'Justin', 'Mithila', 'Hardik'
  ];

  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL'];
  
  const upcomingPayments = [
    {
      icon: <GiHamburgerMenu size={24} />,
      title: 'Fast Food',
      date: '20, Sep',
      sender: 'Peter',
      amount: '+$50'
    },
    {
      icon: <SiNetflix size={24} />,
      title: 'Netflix',
      date: '12, Sep',
      sender: 'John',
      amount: '+$40'
    },
    {
      icon: <SiSpotify size={24} />,
      title: 'Spotify',
      date: '09, Aug',
      sender: 'Anna',
      amount: '+$40'
    }
  ];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <FaChevronLeft size={24} />
        <FaUserCircle size={24} />
      </div>

      <div className={styles.balanceSection}>
        <h2>Total Balance</h2>
        <div className={styles.balance}>$1245.00 USD</div>
        
        <div className={styles.toggleButtons}>
          <button className={styles.activeButton}>Income</button>
          <button>Expenses</button>
        </div>

        <div className={styles.graphContainer}>
          <div className={styles.graph}>
            {months.map((month, index) => (
              <div key={index} className={styles.graphColumn}>
                <div className={styles.graphBar} 
                     style={{ height: `${Math.random() * 100}%` }}>
                  {index === 4 && <div className={styles.graphDot} />}
                </div>
                <span className={styles.monthLabel}>{month}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.upcomingPayments}>
        <h2>Upcoming Payment</h2>
        {upcomingPayments.map((payment, index) => (
          <div key={index} className={styles.paymentItem}>
            <div className={styles.paymentInfo}>
              <div className={styles.paymentIcon}>
                {payment.icon}
              </div>
              <div className={styles.paymentDetails}>
                <div className={styles.paymentTitle}>{payment.title}</div>
                <div className={styles.paymentDate}>
                  {payment.date} {payment.sender} Sent
                </div>
              </div>
            </div>
            <div className={styles.paymentAmount}>{payment.amount}</div>
          </div>
        ))}
      </div>

      <div className={styles.mainCard}>
        <div className={styles.cardHeader}>
          <span>My Wallet</span>
          <span>USD</span>
        </div>
        <div className={styles.balance}>$8,540.00</div>
        <div className={styles.actions}>
          {mainActions.map((action, index) => (
            <button key={index} className={styles.actionButton}>
              {action.icon}
              <span>{action.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className={styles.quickActions}>
        {quickActions.map((action, index) => (
          <div key={index} className={styles.actionItem}>
            <div className={styles.actionIcon} />
            <span>{action.label}</span>
          </div>
        ))}
      </div>

      <div className={styles.cryptoList}>
        {cryptoData.map((crypto, index) => (
          <div key={index} className={styles.cryptoItem}>
            <div className={styles.cryptoInfo}>
              <div className={styles.cryptoIcon} />
              <div>
                <div className={styles.cryptoName}>{crypto.name}</div>
                <div className={styles.cryptoSymbol}>{crypto.symbol}</div>
              </div>
            </div>
            <div className={styles.cryptoValues}>
              <span>{crypto.amount}</span>
              <span className={styles.cryptoChange}>{crypto.change}</span>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.quickTransactions}>
        <div className={styles.sectionHeader}>
          <h2>Quick Transaction</h2>
          <span className={styles.seeAll}>See All</span>
        </div>
        <div className={styles.contactsList}>
          {contacts.map((name, index) => (
            <div key={index} className={styles.contactItem}>
              <div className={styles.contactCircle} />
              <span>{name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}