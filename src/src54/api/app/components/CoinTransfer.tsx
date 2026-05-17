"use client";

import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { doc, getDoc, updateDoc, arrayUnion, collection, query, where, getDocs } from 'firebase/firestore';

interface TransferRequest {
  id: string;
  from: string;
  fromName?: string;
  fromPhotoURL?: string;
  amount: number;
  timestamp: Date;
  status: 'pending' | 'accepted' | 'rejected';
  comment?: string;
  responseComment?: string;
}

interface UserData {
  id: string;
  email: string;
  photoURL?: string;
  displayName?: string;
  coins: number;
}

interface CoinTransferProps {
  currentUserEmail: string;
  currentUserId: string;
  currentBalance: number;
  onTransferComplete?: () => void;
}

export default function CoinTransfer({ 
  currentUserEmail, 
  currentUserId, 
  currentBalance,
  onTransferComplete 
}: CoinTransferProps) {
  const [mode, setMode] = useState<'send' | 'request' | 'pending'>('send');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [recipientData, setRecipientData] = useState<UserData | null>(null);
  const [pendingTransfers, setPendingTransfers] = useState<TransferRequest[]>([]);
  const [responseComment, setResponseComment] = useState('');
  const [selectedTransfer, setSelectedTransfer] = useState<TransferRequest | null>(null);
  const [showResponseModal, setShowResponseModal] = useState(false);

  useEffect(() => {
    fetchPendingTransfers();
  }, [currentUserId]);

  const fetchPendingTransfers = async () => {
    try {
      const userRef = doc(db, 'users', currentUserId);
      const userDoc = await getDoc(userRef);
      if (userDoc.exists()) {
        const transfers = userDoc.data().pendingTransfers || [];
        setPendingTransfers(transfers);
      }
    } catch (err) {
      console.error('Error fetching pending transfers:', err);
    }
  };

  const resetForm = () => {
    setRecipientEmail('');
    setAmount('');
    setError(null);
    setSuccess(null);
    setRecipientData(null);
  };

  const findUserByEmail = async (email: string) => {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', email));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }
    
    return {
      id: querySnapshot.docs[0].id,
      ...querySnapshot.docs[0].data()
    } as UserData;
  };

  const handleSendCoins = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    setRecipientData(null);

    try {
      const coins = parseInt(amount);
      if (isNaN(coins) || coins <= 0) {
        throw new Error('Please enter a valid number of coins');
      }

      if (coins > currentBalance) {
        throw new Error('Insufficient balance');
      }

      if (recipientEmail === currentUserEmail) {
        throw new Error('You cannot send coins to yourself');
      }

      const recipient = await findUserByEmail(recipientEmail);
      if (!recipient) {
        throw new Error('Recipient not found');
      }

      setRecipientData(recipient);

      // Create pending transfer
      const transferId = `transfer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const transferData = {
        id: transferId,
        from: currentUserEmail,
        fromName: currentUserEmail,
        fromPhotoURL: '',
        amount: coins,
        timestamp: new Date(),
        status: 'pending'
      };

      // Deduct from sender's balance and add to pending
      const senderRef = doc(db, 'users', currentUserId);
      await updateDoc(senderRef, {
        coins: currentBalance - coins,
        transferHistory: arrayUnion({
          ...transferData,
          type: 'sent',
          to: recipientEmail
        })
      });

      // Add to recipient's pending transfers
      const recipientRef = doc(db, 'users', recipient.id);
      await updateDoc(recipientRef, {
        pendingTransfers: arrayUnion(transferData)
      });

      setSuccess(`Transfer of ${coins} coins is pending recipient's acceptance`);
      resetForm();
      if (onTransferComplete) {
        onTransferComplete();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to send coins');
      setRecipientData(null);
    } finally {
      setLoading(false);
    }
  };

  const initiateTransferAction = (transfer: TransferRequest, action: 'accept' | 'reject') => {
    setSelectedTransfer(transfer);
    setResponseComment('');
    setShowResponseModal(true);
  };

  const handleTransferAction = async (action: 'accept' | 'reject') => {
    if (!selectedTransfer) return;
    
    setLoading(true);
    try {
      const userRef = doc(db, 'users', currentUserId);
      const senderQuery = query(collection(db, 'users'), where('email', '==', selectedTransfer.from));
      const senderSnapshot = await getDocs(senderQuery);
      
      if (senderSnapshot.empty) {
        throw new Error('Sender not found');
      }
      
      const senderId = senderSnapshot.docs[0].id;
      const senderRef = doc(db, 'users', senderId);

      if (action === 'accept') {
        // Update recipient's balance and history
        await updateDoc(userRef, {
          coins: currentBalance + selectedTransfer.amount,
          pendingTransfers: pendingTransfers.filter(t => t.id !== selectedTransfer.id),
          transferHistory: arrayUnion({
            type: 'received',
            amount: selectedTransfer.amount,
            from: selectedTransfer.from,
            timestamp: new Date(),
            status: 'accepted',
            responseComment: responseComment.trim() || undefined
          })
        });

        // Update sender's transfer history
        await updateDoc(senderRef, {
          transferHistory: arrayUnion({
            type: 'sent',
            amount: selectedTransfer.amount,
            to: currentUserEmail,
            timestamp: new Date(),
            status: 'accepted',
            responseComment: responseComment.trim() || undefined
          })
        });
      } else {
        // Reject: Return coins to sender
        const senderDoc = await getDoc(senderRef);
        const senderBalance = senderDoc.data()?.coins || 0;

        await updateDoc(senderRef, {
          coins: senderBalance + selectedTransfer.amount,
          transferHistory: arrayUnion({
            type: 'sent',
            amount: selectedTransfer.amount,
            to: currentUserEmail,
            timestamp: new Date(),
            status: 'rejected',
            responseComment: responseComment.trim() || undefined
          })
        });

        // Remove from recipient's pending transfers
        await updateDoc(userRef, {
          pendingTransfers: pendingTransfers.filter(t => t.id !== selectedTransfer.id),
          transferHistory: arrayUnion({
            type: 'received',
            amount: selectedTransfer.amount,
            from: selectedTransfer.from,
            timestamp: new Date(),
            status: 'rejected',
            responseComment: responseComment.trim() || undefined
          })
        });
      }

      setSuccess(`Transfer ${action}ed successfully`);
      setShowResponseModal(false);
      setSelectedTransfer(null);
      setResponseComment('');
      fetchPendingTransfers();
      if (onTransferComplete) {
        onTransferComplete();
      }
    } catch (err: any) {
      setError(err.message || `Failed to ${action} transfer`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-900">Transfer Coins</h2>
        <div className="flex gap-2">
          <button
            onClick={() => { setMode('send'); resetForm(); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              mode === 'send'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Send
          </button>
          <button
            onClick={() => { setMode('pending'); resetForm(); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              mode === 'pending'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Pending ({pendingTransfers.length})
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-lg">
          {success}
        </div>
      )}

      {mode === 'pending' ? (
        <div className="space-y-4">
          {pendingTransfers.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No pending transfers</p>
          ) : (
            pendingTransfers.map((transfer) => (
              <div key={transfer.id} className="border rounded-lg p-4">
                <div className="flex items-center space-x-4 mb-3">
                  {transfer.fromPhotoURL ? (
                    <img 
                      src={transfer.fromPhotoURL} 
                      alt="Sender" 
                      className="w-10 h-10 rounded-full"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                      {transfer.from.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="font-medium">{transfer.fromName || transfer.from}</p>
                    <p className="text-sm text-gray-500">
                      {transfer.amount.toLocaleString()} coins
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(transfer.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => initiateTransferAction(transfer, 'accept')}
                      disabled={loading}
                      className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => initiateTransferAction(transfer, 'reject')}
                      disabled={loading}
                      className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <form onSubmit={handleSendCoins}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Recipient Email
              </label>
              <input
                type="email"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter email address"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Number of Coins
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter amount"
                min="1"
                required
              />
            </div>

            <p className="text-sm text-gray-500">
              Available Balance: {currentBalance} coins
            </p>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 rounded-lg font-medium transition-colors ${
                loading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
            >
              {loading ? 'Processing...' : 'Send Coins'}
            </button>
          </div>
        </form>
      )}

      {/* Response Modal */}
      {showResponseModal && selectedTransfer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-bold mb-4">
              {selectedTransfer.status === 'pending' ? 'Add a Comment (Optional)' : 'Transfer Details'}
            </h3>
            <textarea
              value={responseComment}
              onChange={(e) => setResponseComment(e.target.value)}
              placeholder="Add a comment to this transfer..."
              className="w-full px-3 py-2 border rounded-lg mb-4 h-24 resize-none"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowResponseModal(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
              >
                Cancel
              </button>
              <button
                onClick={() => handleTransferAction('accept')}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              >
                Accept
              </button>
              <button
                onClick={() => handleTransferAction('reject')}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 