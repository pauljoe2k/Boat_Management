import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDocuments, useUpdateDocumentStatus, useExportCsv } from '../hooks/useDocuments';
import { useBoats } from '../hooks/useBoats';
import { useToast } from '../context/ToastContext';
import { Header } from '../components/layout/Header';
import { StatCard } from '../components/common/StatCard';
import { DocumentFilters } from '../components/documents/DocumentFilters';
import { DocumentTable } from '../components/documents/DocumentTable';
import { Button } from '../components/common/Button';
import type { DocumentFilterStatus, DocumentSortOption, DocumentItem } from '../types/document';

export const DashboardPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<DocumentFilterStatus>('all');
  const [boatFilter, setBoatFilter] = useState<string | number>('all');
  const [sortOption, setSortOption] = useState<DocumentSortOption>('days');

  const navigate = useNavigate();
  const { showToast } = useToast();

  const { data: boats = [] } = useBoats();
  const { data: documents = [], isLoading, error } = useDocuments({
    search,
    boatId: boatFilter,
    status: statusFilter,
    sort: sortOption,
  });

  const { mutate: updateStatus } = useUpdateDocumentStatus();
  const { mutate: exportCsv, isPending: isExporting } = useExportCsv();

  // Compute summary metrics across all tracked documents
  const allDocsQuery = useDocuments();
  const allDocs = allDocsQuery.data || [];

  const metrics = useMemo(() => {
    const total = allDocs.length;
    const submitted = allDocs.filter((d: DocumentItem) => d.submitted).length;
    const pending = total - submitted;
    const dueSoon = allDocs.filter((d: DocumentItem) => !d.submitted && d.daysLeft <= 60).length;
    const overdue = allDocs.filter((d: DocumentItem) => !d.submitted && d.daysLeft < 0).length;
    return { total, submitted, pending, dueSoon, overdue };
  }, [allDocs]);

  const handleToggleStatus = (id: number, currentSubmitted: boolean) => {
    const nextSubmitted = !currentSubmitted;
    updateStatus(
      { id, submitted: nextSubmitted },
      {
        onSuccess: () => {
          showToast(nextSubmitted ? 'Marked as submitted' : 'Moved back to pending');
        },
        onError: () => {
          showToast('Failed to update document status');
        },
      }
    );
  };

  const handleExportCsv = () => {
    exportCsv(undefined, {
      onSuccess: () => {
        showToast('CSV exported');
      },
      onError: () => {
        showToast('Failed to export CSV');
      },
    });
  };

  const handleClearFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setBoatFilter('all');
    setSortOption('days');
  };

  const todayStr = useMemo(() => {
    return new Date().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }, []);

  return (
    <div>
      <Header
        title="Document dashboard"
        subtitle={`As of ${todayStr} · reminders go out 60 days before expiry`}
        actions={
          <>
            <Button variant="outline" onClick={handleExportCsv} isLoading={isExporting}>
              Export CSV
            </Button>
            <Button onClick={() => navigate('/add')}>+ Add document</Button>
          </>
        }
      />

      {/* 4 Summary Metric Cards (Tracked, Submitted, Pending, Due Soon) */}
      <section className="stats" aria-label="Compliance Summary Statistics">
        <StatCard
          variant="s1"
          count={metrics.total}
          label="Tracked documents"
          isActive={statusFilter === 'all'}
          onClick={() => setStatusFilter('all')}
        />
        <StatCard
          variant="s2"
          count={metrics.submitted}
          label="Submitted"
          isActive={statusFilter === 'yes'}
          onClick={() => setStatusFilter('yes')}
        />
        <StatCard
          variant="s3"
          count={metrics.pending}
          label="Pending renewal"
          isActive={statusFilter === 'no'}
          onClick={() => setStatusFilter('no')}
        />
        <StatCard
          variant="s4"
          count={metrics.dueSoon}
          label="Due soon (60 days)"
          isActive={statusFilter === 'due'}
          onClick={() => setStatusFilter('due')}
        />
      </section>

      {/* Filters: Chips, Search, Boat Selector, Sort */}
      <DocumentFilters
        search={search}
        onSearchChange={setSearch}
        status={statusFilter}
        onStatusChange={setStatusFilter}
        boatId={boatFilter}
        onBoatIdChange={setBoatFilter}
        sort={sortOption}
        onSortChange={setSortOption}
        boats={boats}
      />

      {/* Error state */}
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
          Failed to load documents: {error instanceof Error ? error.message : 'Unknown error'}
        </div>
      )}

      {/* Loading & Data Table */}
      {isLoading ? (
        <div className="card empty">
          <p>Loading documents...</p>
        </div>
      ) : (
        <DocumentTable
          documents={documents}
          onToggleStatus={handleToggleStatus}
          onClearFilters={handleClearFilters}
          showClearButton={Boolean(search || statusFilter !== 'all' || boatFilter !== 'all')}
        />
      )}
    </div>
  );
};
