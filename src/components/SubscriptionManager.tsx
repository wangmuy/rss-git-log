import React, { useRef, useState } from 'react';
import {
  Paper,
  Box,
  Typography,
  Button,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Chip,
  Collapse,
  Tooltip,
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, Edit as EditIcon, ExpandMore as ExpandMoreIcon, ExpandLess as ExpandLessIcon, Upload as UploadIcon, Download as DownloadIcon } from '@mui/icons-material';
import { RSSSite } from '@/types/rss';
import { parseOPML, serializeOPML } from '@/utils/opml';

interface SubscriptionManagerProps {
  sites: RSSSite[];
  onSitesChange: (sites: RSSSite[]) => void;
  onSave: () => Promise<void>;
}

interface SiteFormData {
  name: string;
  url: string;
  color: string;
}

export const SubscriptionManager: React.FC<SubscriptionManagerProps> = ({
  sites,
  onSitesChange,
  onSave
}) => {
  const [expanded, setExpanded] = useState(false);
  const [open, setOpen] = useState(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [formData, setFormData] = useState<SiteFormData>({
    name: '',
    url: '',
    color: '#1976d2'
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importWarning, setImportWarning] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAdd = () => {
    setEditIndex(null);
    setFormData({ name: '', url: '', color: '#1976d2' });
    setOpen(true);
  };

  const handleEdit = (index: number) => {
    setEditIndex(index);
    const site = sites[index];
    setFormData({
      name: site.name,
      url: site.url,
      color: site.color || '#1976d2'
    });
    setOpen(true);
  };

  const handleDelete = (index: number) => {
    const newSites = sites.filter((_, i) => i !== index);
    onSitesChange(newSites);
  };

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.url.trim()) {
      setError('Name and URL are required');
      return;
    }

    const newSite: RSSSite = {
      name: formData.name.trim(),
      url: formData.url.trim(),
      color: formData.color
    };

    let newSites: RSSSite[];
    if (editIndex !== null) {
      newSites = sites.map((site, i) => i === editIndex ? newSite : site);
    } else {
      newSites = [...sites, newSite];
    }

    onSitesChange(newSites);
    setOpen(false);
    setError(null);
  };

  const handleSaveToGitHub = async () => {
    setSaving(true);
    setError(null);
    try {
      await onSave();
    } catch (err: any) {
      setError(err.message || 'Failed to save to GitHub');
    } finally {
      setSaving(false);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImportFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    setImportWarning(null);

    try {
      const text = await file.text();
      const { sites: importedSites } = parseOPML(text);

      if (importedSites.length === 0) {
        setError('No RSS feeds found in the OPML file.');
        return;
      }

      const existingUrls = new Set(sites.map(s => s.url.toLowerCase()));
      const skipped: string[] = [];
      const newSites: RSSSite[] = [];

      for (const site of importedSites) {
        if (existingUrls.has(site.url.toLowerCase())) {
          skipped.push(site.url);
        } else {
          newSites.push(site);
          existingUrls.add(site.url.toLowerCase());
        }
      }

      if (newSites.length > 0) {
        onSitesChange([...sites, ...newSites]);
      }

      if (skipped.length > 0) {
        setImportWarning(`Skipped ${skipped.length} duplicate(s): ${skipped.join(', ')}`);
      } else if (newSites.length === 0) {
        setError('All feeds in the OPML file are already in your subscription list.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to import OPML file');
    }

    event.target.value = '';
  };

  const handleExport = () => {
    const opml = serializeOPML(sites);
    const blob = new Blob([opml], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'subscriptions.opml';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Paper sx={{ mb: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, pb: expanded ? 0 : 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            RSS Subscriptions ({sites.length})
          </Typography>
          <Tooltip title={expanded ? 'Collapse' : 'Expand'}>
            <IconButton size="small" onClick={() => setExpanded(!expanded)}>
              {expanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
            </IconButton>
          </Tooltip>
        </Box>
        {expanded && (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              startIcon={<AddIcon />}
              onClick={handleAdd}
              size="small"
              variant="outlined"
            >
              Add Feed
            </Button>
            <Button
              startIcon={<UploadIcon />}
              onClick={handleImportClick}
              size="small"
              variant="outlined"
            >
              Import OPML
            </Button>
            <Button
              startIcon={<DownloadIcon />}
              onClick={handleExport}
              size="small"
              variant="outlined"
              disabled={sites.length === 0}
            >
              Export OPML
            </Button>
            <Button
              onClick={handleSaveToGitHub}
              disabled={saving}
              size="small"
              variant="contained"
            >
              {saving ? 'Saving...' : 'Save to GitHub'}
            </Button>
          </Box>
        )}
      </Box>

      <input
        ref={fileInputRef}
        type="file"
        accept=".opml,.xml"
        style={{ display: 'none' }}
        onChange={handleImportFile}
      />

      <Collapse in={expanded}>
        <Box sx={{ p: 2, pt: 0 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          {importWarning && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              {importWarning}
            </Alert>
          )}

          <List dense>
            {sites.map((site, index) => (
              <ListItem key={index} divider>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip
                        size="small"
                        sx={{ 
                          backgroundColor: site.color || '#1976d2',
                          color: 'white',
                          minWidth: 8,
                          height: 16,
                          '& .MuiChip-label': { px: 0.5 }
                        }}
                        label=""
                      />
                      {site.name}
                    </Box>
                  }
                  secondary={site.url}
                />
                <ListItemSecondaryAction>
                  <IconButton
                    edge="end"
                    onClick={() => handleEdit(index)}
                    size="small"
                    sx={{ mr: 1 }}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    edge="end"
                    onClick={() => handleDelete(index)}
                    size="small"
                    color="error"
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
            {sites.length === 0 && (
              <ListItem>
                <ListItemText
                  primary="No RSS feeds configured"
                  secondary="Click 'Add Feed' to get started"
                />
              </ListItem>
            )}
          </List>
        </Box>
      </Collapse>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editIndex !== null ? 'Edit RSS Feed' : 'Add RSS Feed'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              label="Feed Name"
              fullWidth
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Hacker News"
            />
            <TextField
              label="RSS URL"
              fullWidth
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              placeholder="e.g., https://news.ycombinator.com/rss"
            />
            <TextField
              label="Color"
              type="color"
              value={formData.color}
              onChange={(e) => setFormData({ ...formData, color: e.target.value })}
              sx={{ width: 120 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">
            {editIndex !== null ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};