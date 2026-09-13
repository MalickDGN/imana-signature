'use client';

import { ChangeEvent, DragEvent, useRef, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  FileCheck2,
  FileSpreadsheet,
  LoaderCircle,
  RefreshCw,
  ShieldCheck,
  Upload,
  XCircle,
} from 'lucide-react';

interface ImportIssue {
  row: number;
  field: string;
  severity: 'error' | 'warning';
  code: string;
  message: string;
}

interface ImportResult {
  batchId: string;
  fileName: string;
  status: 'validated' | 'importing' | 'completed' | 'failed';
  expiresAt: string;
  summary: {
    totalRows: number;
    validRows: number;
    errors: number;
    warnings: number;
    created: number;
    updated: number;
    failed: number;
  };
  issues: ImportIssue[];
  canImport: boolean;
}

export function CatalogImportPanel() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File>();
  const [result, setResult] = useState<ImportResult>();
  const [errorMessage, setErrorMessage] = useState('');
  const [validating, setValidating] = useState(false);
  const [importing, setImporting] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const chooseFile = (selected?: File) => {
    setErrorMessage('');
    setResult(undefined);
    setConfirmed(false);
    if (!selected) return;
    if (!selected.name.toLowerCase().endsWith('.xlsx')) {
      setFile(undefined);
      setErrorMessage('Sélectionnez un fichier Excel au format .xlsx.');
      return;
    }
    if (selected.size > 10 * 1024 * 1024) {
      setFile(undefined);
      setErrorMessage('Le fichier dépasse la limite de 10 Mo.');
      return;
    }
    setFile(selected);
  };

  const onFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    chooseFile(event.target.files?.[0]);
  };

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragActive(false);
    chooseFile(event.dataTransfer.files?.[0]);
  };

  const validate = async () => {
    if (!file) return;
    setValidating(true);
    setErrorMessage('');
    const formData = new FormData();
    formData.append('file', file);
    try {
      const response = await fetch('/api/catalog-import/validate', {
        method: 'POST',
        body: formData,
      });
      const payload = await readJson(response);
      if (!response.ok) {
        throw new Error(getMessage(payload));
      }
      setResult(payload as ImportResult);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Validation impossible.',
      );
    } finally {
      setValidating(false);
    }
  };

  const executeImport = async () => {
    if (!result?.canImport || !confirmed) return;
    setImporting(true);
    setErrorMessage('');
    try {
      const response = await fetch(
        `/api/catalog-import/${encodeURIComponent(result.batchId)}/execute`,
        { method: 'POST' },
      );
      const payload = await readJson(response);
      if (!response.ok) throw new Error(getMessage(payload));
      setResult(payload as ImportResult);
      setConfirmed(false);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Import impossible.',
      );
    } finally {
      setImporting(false);
    }
  };

  const restart = () => {
    setFile(undefined);
    setResult(undefined);
    setErrorMessage('');
    setConfirmed(false);
    if (inputRef.current) inputRef.current.value = '';
  };

  const hasCompleted = result?.status === 'completed';
  const hasImportFailure = result?.status === 'failed';

  return (
    <section className="panel import-panel" id="catalog-import">
      <div className="panel-heading import-heading">
        <div>
          <p className="eyebrow">Initialisation du référentiel</p>
          <h2>Import Excel du catalogue</h2>
        </div>
        <a
          className="template-action"
          href="/templates/modele-import-catalogue-imana.xlsx"
          download
        >
          <Download size={16} />
          Télécharger le modèle
        </a>
      </div>

      <div className="import-workflow" aria-label="Étapes de l’import">
        <WorkflowStep number="1" label="Fichier" active={!result} done={Boolean(result)} />
        <span />
        <WorkflowStep
          number="2"
          label="Validation"
          active={result?.status === 'validated'}
          done={Boolean(result && result.summary.errors === 0)}
        />
        <span />
        <WorkflowStep
          number="3"
          label="Import Odoo"
          active={importing}
          done={hasCompleted}
        />
      </div>

      {!result && (
        <div
          className={`file-dropzone ${dragActive ? 'is-dragging' : ''}`}
          onDragEnter={(event) => {
            event.preventDefault();
            setDragActive(true);
          }}
          onDragOver={(event) => event.preventDefault()}
          onDragLeave={() => setDragActive(false)}
          onDrop={onDrop}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            onChange={onFileChange}
          />
          <span className="dropzone-icon">
            <FileSpreadsheet size={27} />
          </span>
          <strong>
            {file ? file.name : 'Déposez votre fichier Excel ici'}
          </strong>
          <p>
            {file
              ? `${formatBytes(file.size)} · prêt pour validation`
              : 'Classeur .xlsx, 10 Mo et 5 000 lignes maximum'}
          </p>
          <div className="dropzone-actions">
            <button
              className="secondary-button"
              type="button"
              onClick={() => inputRef.current?.click()}
            >
              <Upload size={16} />
              {file ? 'Changer de fichier' : 'Choisir un fichier'}
            </button>
            {file && (
              <button
                className="primary-button"
                type="button"
                disabled={validating}
                onClick={validate}
              >
                {validating ? (
                  <LoaderCircle className="is-spinning" size={16} />
                ) : (
                  <ShieldCheck size={16} />
                )}
                {validating ? 'Validation…' : 'Valider les données'}
              </button>
            )}
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="import-message is-error" role="alert">
          <XCircle size={18} />
          <span>{errorMessage}</span>
        </div>
      )}

      {result && (
        <>
          <div className="import-file-summary">
            <span className="file-summary-icon">
              <FileCheck2 size={22} />
            </span>
            <div>
              <strong>{result.fileName}</strong>
              <small>
                Lot {result.batchId.slice(0, 8)} · expire à{' '}
                {new Intl.DateTimeFormat('fr-FR', {
                  hour: '2-digit',
                  minute: '2-digit',
                }).format(new Date(result.expiresAt))}
              </small>
            </div>
            <button className="text-button" type="button" onClick={restart}>
              <RefreshCw size={15} />
              Corriger et relancer
            </button>
          </div>

          <div className="import-stats">
            <ImportStat label="Lignes" value={result.summary.totalRows} />
            <ImportStat
              label="Valides"
              value={result.summary.validRows}
              tone="success"
            />
            <ImportStat
              label="Erreurs"
              value={result.summary.errors}
              tone={result.summary.errors > 0 ? 'danger' : undefined}
            />
            <ImportStat
              label="Anomalies"
              value={result.summary.warnings}
              tone={result.summary.warnings > 0 ? 'warning' : undefined}
            />
            {(hasCompleted || hasImportFailure) && (
              <>
                <ImportStat
                  label="Créés"
                  value={result.summary.created}
                  tone="success"
                />
                <ImportStat label="Mis à jour" value={result.summary.updated} />
                <ImportStat
                  label="Échecs"
                  value={result.summary.failed}
                  tone={result.summary.failed > 0 ? 'danger' : undefined}
                />
              </>
            )}
          </div>

          {result.issues.length > 0 ? (
            <div className="issues-block">
              <div className="issues-title">
                <div>
                  <strong>Erreurs et anomalies détectées</strong>
                  <small>Corrigez les erreurs avant toute écriture dans Odoo.</small>
                </div>
                <a
                  className="text-button"
                  href={`/api/catalog-import/${encodeURIComponent(result.batchId)}/report`}
                  download
                >
                  <Download size={15} />
                  Rapport détaillé
                </a>
              </div>
              <div className="issues-table-wrap">
                <table className="issues-table">
                  <thead>
                    <tr>
                      <th>Niveau</th>
                      <th>Ligne</th>
                      <th>Champ</th>
                      <th>Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.issues.slice(0, 100).map((issue, index) => (
                      <tr key={`${issue.row}-${issue.code}-${index}`}>
                        <td>
                          <span className={`issue-badge is-${issue.severity}`}>
                            {issue.severity === 'error' ? (
                              <XCircle size={13} />
                            ) : (
                              <AlertTriangle size={13} />
                            )}
                            {issue.severity === 'error' ? 'Erreur' : 'Anomalie'}
                          </span>
                        </td>
                        <td>{issue.row || 'Fichier'}</td>
                        <td>{issue.field}</td>
                        <td>{issue.message}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="import-message is-success">
              <CheckCircle2 size={19} />
              <span>Le fichier est valide et peut être importé dans Odoo.</span>
            </div>
          )}

          {result.canImport && (
            <div className="import-confirm">
              <label>
                <input
                  type="checkbox"
                  checked={confirmed}
                  onChange={(event) => setConfirmed(event.target.checked)}
                />
                <span>
                  J’ai vérifié le rapport et je confirme l’écriture dans Odoo.
                </span>
              </label>
              <button
                className="primary-button"
                type="button"
                disabled={!confirmed || importing}
                onClick={executeImport}
              >
                {importing ? (
                  <LoaderCircle className="is-spinning" size={16} />
                ) : (
                  <Upload size={16} />
                )}
                {importing ? 'Import en cours…' : 'Importer dans Odoo'}
              </button>
            </div>
          )}

          {(hasCompleted || hasImportFailure) && (
            <div
              className={`import-message ${
                hasCompleted ? 'is-success' : 'is-error'
              }`}
            >
              {hasCompleted ? <CheckCircle2 size={19} /> : <XCircle size={19} />}
              <span>
                {hasCompleted
                  ? `Import terminé : ${result.summary.created} création(s), ${result.summary.updated} mise(s) à jour.`
                  : `Import partiel : ${result.summary.failed} ligne(s) en échec. Consultez le rapport puis relancez le fichier corrigé.`}
              </span>
              <a
                href={`/api/catalog-import/${encodeURIComponent(result.batchId)}/report`}
                download
              >
                Télécharger le rapport
              </a>
            </div>
          )}
        </>
      )}
    </section>
  );
}

function WorkflowStep({
  number,
  label,
  active,
  done,
}: {
  number: string;
  label: string;
  active?: boolean;
  done?: boolean;
}) {
  return (
    <div className={`workflow-step ${active ? 'is-active' : ''} ${done ? 'is-done' : ''}`}>
      <span>{done ? <CheckCircle2 size={15} /> : number}</span>
      <strong>{label}</strong>
    </div>
  );
}

function ImportStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: 'success' | 'warning' | 'danger';
}) {
  return (
    <div className={`import-stat ${tone ? `is-${tone}` : ''}`}>
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return { message: `Le serveur a répondu avec le statut ${response.status}.` };
  }
}

function getMessage(payload: unknown): string {
  if (!payload || typeof payload !== 'object') return 'Une erreur est survenue.';
  const message = (payload as Record<string, unknown>).message;
  return Array.isArray(message)
    ? message.map(String).join(' ')
    : typeof message === 'string'
      ? message
      : 'Une erreur est survenue.';
}

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.ceil(bytes / 1024)} Ko`;
  return `${(bytes / 1024 / 1024).toFixed(1)} Mo`;
}
