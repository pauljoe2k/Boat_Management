import React, { useState, useMemo } from 'react';
import { useReminders } from '../hooks/useReminders';
import { useDocuments, useUpdateDocumentStatus } from '../hooks/useDocuments';
import { useToast } from '../context/ToastContext';
import { Header } from '../components/layout/Header';
import { Card } from '../components/common/Card';
import { ReminderItem } from '../components/reminders/ReminderItem';
import { TestPushModal } from '../components/reminders/TestPushModal';
import { Button } from '../components/common/Button';
import type { DocumentItem } from '../types/document';
import type { ReminderItem as ReminderItemType } from '../types/reminder';

export const RemindersPage: React.FC = () => {
  const [isTestPushOpen, setIsTestPushOpen] = useState(false);

  const { showToast } = useToast();
  const { data: reminders = [], isLoading, error } = useReminders();
  const { data: documents = [] } = useDocuments();
  const { mutate: updateDocStatus } = useUpdateDocumentStatus();

  // Find the soonest unsubmitted document for the test push preview modal
  const urgentUnsubmittedDoc = useMemo(() => {
    const unsubmitted = documents.filter((d: DocumentItem) => !d.submitted);
    unsubmitted.sort((a: DocumentItem, b: DocumentItem) => a.daysLeft - b.daysLeft);
    return unsubmitted[0] || null;
  }, [documents]);

  const handleRenewed = (docId: number) => {
    updateDocStatus(
      { id: docId, submitted: true },
      {
        onSuccess: () => {
          showToast('Great, marked as renewed');
          setIsTestPushOpen(false);
        },
      }
    );
  };

  const handleSnooze = () => {
    showToast('Snoozed for 3 days');
    setIsTestPushOpen(false);
  };

  return (
    <div>
      <Header
        title="Reminders"
        subtitle="Push first, email backup, SMS as the last resort"
        actions={
          <Button onClick={() => setIsTestPushOpen(true)}>Send test push</Button>
        }
      />

      {error && (
        <div
          role="alert"
          style={{
            background: 'var(--r)',
            color: 'var(--rt)',
            padding: '16px',
            borderRadius: '12px',
            marginBottom: '16px',
          }}
        >
          Failed to load reminders: {error instanceof Error ? error.message : 'Unknown error'}
        </div>
      )}

      {isLoading ? (
        <Card className="empty">
          <p>Loading reminder timeline...</p>
        </Card>
      ) : reminders.length > 0 ? (
        <Card>
          {reminders.map((reminder: ReminderItemType) => (
            <ReminderItem key={reminder.id} reminder={reminder} />
          ))}
        </Card>
      ) : (
        <Card className="empty">
          <p>No pending reminders. All documents are up to date!</p>
        </Card>
      )}

      <TestPushModal
        isOpen={isTestPushOpen}
        onClose={() => setIsTestPushOpen(false)}
        document={urgentUnsubmittedDoc}
        onRenewed={handleRenewed}
        onSnooze={handleSnooze}
      />
    </div>
  );
};
