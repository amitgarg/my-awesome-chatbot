'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface UseDeleteChatReturn {
  deleteId: string | null;
  openDeleteDialog: (chatId: string) => void;
  DeleteDialog: React.ComponentType;
}

export function useDeleteChat(onDeleteSuccess: () => void): UseDeleteChatReturn {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const openDeleteDialog = (chatId: string) => {
    setDeleteId(chatId);
    setShowDeleteDialog(true);
  };

  const DeleteDialog = () => {
    const handleDelete = async () => {
      if (!deleteId) return;

      const deletePromise = fetch(`/api/chat?id=${deleteId}`, {
        method: 'DELETE',
      });

      toast.promise(deletePromise, {
        loading: 'Deleting chat...',
        success: () => {
          onDeleteSuccess();
          return 'Chat deleted successfully';
        },
        error: 'Failed to delete chat',
      });

      setShowDeleteDialog(false);
    };

    return (
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your
              chat and remove it from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  };

  return {
    deleteId,
    openDeleteDialog,
    DeleteDialog,
  };
}