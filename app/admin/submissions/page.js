'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import {
  collection, query, orderBy, getDocs, doc, deleteDoc, updateDoc, setDoc
} from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
import { db, storage } from '../../../lib/firebase';
import { extractStorageFileName } from '../../../lib/utils';
import {
  FileText, Check, X, Eye, Trash2, Edit, ChevronDown, ChevronUp, Search
} from 'lucide-react';
import { addDoc, serverTimestamp } from 'firebase/firestore';

export default function SubmissionsPage() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortField, setSortField] = useState('createdAt');
  const [sortDirection, setSortDirection] = useState('desc');
  const [processingId, setProcessingId] = useState(null);
  const router = useRouter();

  // Fetch submissions
  useEffect(() => {
    async function fetchSubmissions() {
      try {
        setLoading(true);
        const submissionsRef = collection(db, "submissions");
        const q = query(
          submissionsRef,
          orderBy(sortField, sortDirection)
        );

        const querySnapshot = await getDocs(q);
        const results = [];

        querySnapshot.forEach((doc) => {
          results.push({ id: doc.id, ...doc.data() });
        });

        setSubmissions(results);
      } catch (err) {
        console.error("Error fetching submissions:", err);
        setError("Failed to load submissions");
      } finally {
        setLoading(false);
      }
    }

    fetchSubmissions();
  }, [sortField, sortDirection]);

  // Handle sort toggle
  const handleSort = (field) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Approve submission
  const handleApprove = async (submission) => {
    if (processingId) return;

    try {
      setProcessingId(submission.id);

      // Check if submission has an image
      let imageUrl = submission.imageUrl || '';

      // If there's an image, you might want to move it from submissions/ to articles/
      // This requires downloading and reuploading to a new path
      // For now, we'll just keep it in the submissions folder

      // Convert submission to article
      const articleData = {
        title: submission.title,
        description: submission.description,
        content: submission.content,
        author: submission.author,
        category: submission.category,
        date: new Date().toISOString(),
        imageUrl: imageUrl,
        slug: submission.slug,
        status: 'published',
        createdAt: serverTimestamp()
      };

      // Add to articles collection
      await addDoc(collection(db, "articles"), articleData);

      // Delete from submissions (but NOT the image since we're using it in the article)
      await deleteDoc(doc(db, "submissions", submission.id));

      // Update UI
      setSubmissions(submissions.filter(s => s.id !== submission.id));

    } catch (err) {
      console.error("Error approving submission:", err);
      setError("Failed to approve submission");
    } finally {
      setProcessingId(null);
    }
  };

  // Reject submission
  const handleReject = async (submissionId) => {
    if (processingId) return;

    try {
      setProcessingId(submissionId);

      // Get the submission to check for images
      const submissionRef = doc(db, "submissions", submissionId);
      const submissionSnap = await getDoc(submissionRef);

      if (submissionSnap.exists()) {
        const submissionData = submissionSnap.data();

        // Delete image from storage if it exists
        if (submissionData.imageUrl) {
          try {
            // Use the utility function to extract the filename
            const fileName = extractStorageFileName(submissionData.imageUrl);

            if (fileName) {
              const fileRef = ref(storage, `submissions/${fileName}`);
              await deleteObject(fileRef);
              console.log('Submission image deleted from storage');
            } else {
              console.warn('Could not extract filename from URL:', submissionData.imageUrl);
            }
          } catch (fileError) {
            console.error("Error deleting submission image:", fileError);
            // Continue with document deletion
          }
        }
      }

      // Delete from submissions
      await deleteDoc(doc(db, "submissions", submissionId));

      // Update UI
      setSubmissions(submissions.filter(s => s.id !== submissionId));

    } catch (err) {
      console.error("Error rejecting submission:", err);
      setError("Failed to reject submission");
    } finally {
      setProcessingId(null);
    }
  };

  // Format date
  const formatDate = (dateStr) => {
    if (!dateStr) return "No date";
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-serif font-bold">Submissions</h1>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-md">
          {error}
        </div>
      )}

      {loading ? (
        <div className="py-12 flex justify-center">
          <div className="w-10 h-10 border-4 border-black/10 border-t-black rounded-full animate-spin"></div>
        </div>
      ) : submissions.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-lg text-black/70">No pending submissions</p>
        </div>
      ) : (
        <div className="bg-white rounded-md shadow-sm border border-black/5 overflow-hidden">
          <div className="grid grid-cols-12 gap-4 p-4 bg-black/5 text-sm font-medium">
            <div className="col-span-6">
              <button
                onClick={() => handleSort('title')}
                className="flex items-center hover:text-black/80"
              >
                Title
                {sortField === 'title' && (
                  sortDirection === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />
                )}
              </button>
            </div>
            <div className="col-span-2">Category</div>
            <div className="col-span-2">
              <button
                onClick={() => handleSort('createdAt')}
                className="flex items-center hover:text-black/80"
              >
                Date
                {sortField === 'createdAt' && (
                  sortDirection === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />
                )}
              </button>
            </div>
            <div className="col-span-2 text-right">Actions</div>
          </div>

          <div className="divide-y divide-black/5">
            {submissions.map((submission) => (
              <motion.div
                key={submission.id}
                className="grid grid-cols-12 gap-4 p-4 items-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <div className="col-span-6 flex items-center">
                  {submission.imageUrl ? (
                    <div className="w-10 h-10 relative rounded overflow-hidden mr-3 flex-shrink-0">
                      <Image
                        src={submission.imageUrl}
                        alt={submission.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-10 h-10 bg-gray-100 rounded mr-3 flex items-center justify-center flex-shrink-0">
                      <FileText size={16} className="text-gray-400" />
                    </div>
                  )}
                  <div className="truncate">
                    <div>{submission.title}</div>
                    <div className="text-xs text-black/60">By {submission.author || 'Anonymous'}</div>
                  </div>
                </div>
                <div className="col-span-2 capitalize">
                  {submission.category}
                </div>
                <div className="col-span-2 text-sm text-black/70">
                  {formatDate(submission.date)}
                </div>
                <div className="col-span-2 flex justify-end space-x-1">
                  <button
                    onClick={() => handleApprove(submission)}
                    disabled={processingId === submission.id}
                    className="p-1.5 rounded-md hover:bg-green-50 hover:text-green-600 transition-colors"
                    title="Approve"
                  >
                    {processingId === submission.id ? (
                      <div className="w-4 h-4 border-2 border-green-200 border-t-green-600 rounded-full animate-spin"></div>
                    ) : (
                      <Check size={16} />
                    )}
                  </button>
                  <Link
                    href={`/admin/submissions/preview/${submission.id}`}
                    className="p-1.5 rounded-md hover:bg-black/5 transition-colors"
                    title="Preview"
                  >
                    <Eye size={16} />
                  </Link>
                  <button
                    onClick={() => handleReject(submission.id)}
                    disabled={processingId === submission.id}
                    className="p-1.5 rounded-md hover:bg-red-50 hover:text-red-600 transition-colors"
                    title="Reject"
                  >
                    {processingId === submission.id ? (
                      <div className="w-4 h-4 border-2 border-red-200 border-t-red-600 rounded-full animate-spin"></div>
                    ) : (
                      <X size={16} />
                    )}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}