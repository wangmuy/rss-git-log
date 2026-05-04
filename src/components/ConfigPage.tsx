import React, { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  FormControlLabel,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Switch,
  TextField,
  Typography
} from '@mui/material';
import { AppConfig, CORSPolicyMode } from '@/types/config';
import {
  createDefaultAppConfig,
  loadAppConfig,
  saveAppConfig,
  validateAppConfig,
  clearAllLocalStorage
} from '@/utils/app-config';
import { useReaderStore } from '../store/readerStore';
import {
  checkGitHubWriteCapability,
  createGitHubClient,
  saveGitHubWriteCapability
} from '@/utils/github-api';
import { pruneCachedLogFiles } from '@/utils/log-cache';

interface ConfigPageProps {
  onConfigured?: () => void;
  onCancel?: () => void;
}

function proxiesToText(config: AppConfig): string {
  return config.corsPolicy.proxies
    .map(proxy => `${proxy.name}|${proxy.urlTemplate}`)
    .join('\n');
}

function textToProxies(text: string): AppConfig['corsPolicy']['proxies'] {
  return text
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      const [name, ...templateParts] = line.split('|');
      return {
        name: name.trim() || `Proxy ${index + 1}`,
        urlTemplate: templateParts.join('|').trim()
      };
    });
}

export const ConfigPage: React.FC<ConfigPageProps> = ({ onConfigured, onCancel }) => {
  const [config, setConfig] = useState<AppConfig>(() => loadAppConfig());
  const [proxyText, setProxyText] = useState(() => proxiesToText(loadAppConfig()));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [clearDialogOpen, setClearDialogOpen] = useState(false);

  const updateConfig = (next: AppConfig) => {
    setConfig(createDefaultAppConfig(next));
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setMessage(null);

    const nextConfig = createDefaultAppConfig({
      ...config,
      corsPolicy: {
        ...config.corsPolicy,
        proxies: textToProxies(proxyText)
      }
    });

    const validationErrors = validateAppConfig(nextConfig);
    if (validationErrors.length > 0) {
      setError(validationErrors.join('. '));
      setSaving(false);
      return;
    }

    try {
      const capability = await checkGitHubWriteCapability(createGitHubClient(nextConfig.github));
      const savedConfig = createDefaultAppConfig({
        ...nextConfig,
        githubWriteCapability: capability,
        autoCommit: {
          ...nextConfig.autoCommit,
          enabled: capability.canWrite ? nextConfig.autoCommit.enabled : false
        }
      });

      saveAppConfig(savedConfig);
      saveGitHubWriteCapability(savedConfig.github, capability);
      pruneCachedLogFiles(savedConfig.github);
      setConfig(savedConfig);
      setMessage(capability.canWrite ? 'Configuration saved. GitHub writes are enabled.' : 'Configuration saved. GitHub writes are disabled.');
      onConfigured?.();
    } catch (err: any) {
      setError(err.message || 'Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  const handleClear = () => {
    clearAllLocalStorage();
    useReaderStore.getState().clearSession();
    setClearDialogOpen(false);
    setMessage('All local data cleared.');
    setConfig(createDefaultAppConfig());
    setProxyText(proxiesToText(createDefaultAppConfig()));
  };

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Stack spacing={2}>
        <Box>
          <Typography variant="h4" component="h1" fontWeight={700}>
            Config
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Runtime setup for GitHub storage, RSS fetching, commits, and local cache.
          </Typography>
        </Box>

        {error && <Alert severity="error">{error}</Alert>}
        {message && <Alert severity="success">{message}</Alert>}
        {!config.githubWriteCapability.canWrite && config.githubWriteCapability.reason && (
          <Alert severity="warning">{config.githubWriteCapability.reason}</Alert>
        )}

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                GitHub
              </Typography>
              <Stack spacing={2}>
                <TextField
                  label="Owner"
                  required
                  value={config.github.owner}
                  onChange={(event) => updateConfig({
                    ...config,
                    github: { ...config.github, owner: event.target.value.trim() }
                  })}
                />
                <TextField
                  label="Repository"
                  required
                  value={config.github.repo}
                  onChange={(event) => updateConfig({
                    ...config,
                    github: { ...config.github, repo: event.target.value.trim() }
                  })}
                />
                <TextField
                  label="Branch"
                  required
                  value={config.github.branch}
                  onChange={(event) => updateConfig({
                    ...config,
                    github: { ...config.github, branch: event.target.value.trim() || 'rss-reader-data' }
                  })}
                />
                <TextField
                  label="Token"
                  type="password"
                  value={config.github.token ?? ''}
                  onChange={(event) => updateConfig({
                    ...config,
                    github: { ...config.github, token: event.target.value.trim() || undefined }
                  })}
                />
              </Stack>
            </Paper>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Commit
              </Typography>
              <Stack spacing={2}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={config.autoCommit.enabled}
                      onChange={(event) => updateConfig({
                        ...config,
                        autoCommit: { ...config.autoCommit, enabled: event.target.checked }
                      })}
                    />
                  }
                  label="Auto-commit"
                />
                <TextField
                  label="Interval seconds"
                  type="number"
                  value={config.autoCommit.intervalSeconds}
                  onChange={(event) => updateConfig({
                    ...config,
                    autoCommit: {
                      ...config.autoCommit,
                      intervalSeconds: Number(event.target.value)
                    }
                  })}
                  inputProps={{ min: 30 }}
                />
              </Stack>
            </Paper>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                CORS
              </Typography>
              <Stack spacing={2}>
                <FormControl fullWidth>
                  <InputLabel>Mode</InputLabel>
                  <Select
                    label="Mode"
                    value={config.corsPolicy.mode}
                    onChange={(event) => updateConfig({
                      ...config,
                      corsPolicy: {
                        ...config.corsPolicy,
                        mode: event.target.value as CORSPolicyMode
                      }
                    })}
                  >
                    <MenuItem value="proxy-fallback">Direct, then proxies</MenuItem>
                    <MenuItem value="direct-only">Direct only</MenuItem>
                    <MenuItem value="proxy-only">Proxy only</MenuItem>
                  </Select>
                </FormControl>
                <TextField
                  label="Timeout milliseconds"
                  type="number"
                  value={config.corsPolicy.timeoutMs}
                  onChange={(event) => updateConfig({
                    ...config,
                    corsPolicy: {
                      ...config.corsPolicy,
                      timeoutMs: Number(event.target.value)
                    }
                  })}
                  inputProps={{ min: 1000 }}
                />
                <TextField
                  label="Proxy templates"
                  multiline
                  minRows={4}
                  value={proxyText}
                  onChange={(event) => setProxyText(event.target.value)}
                  helperText="One per line: name|https://proxy.example/?url={url}"
                />
              </Stack>
            </Paper>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Local Cache
              </Typography>
              <TextField
                label="Log files per site"
                type="number"
                value={config.localCache.filesPerSite}
                onChange={(event) => updateConfig({
                  ...config,
                  localCache: {
                    filesPerSite: Number(event.target.value)
                  }
                })}
                inputProps={{ min: 0, max: 30 }}
                fullWidth
              />
            </Paper>
          </Grid>
        </Grid>

        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'space-between', alignItems: 'center' }}>
          <Button variant="outlined" color="error" onClick={() => setClearDialogOpen(true)}>
            Clear All Data
          </Button>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {onCancel && (
              <Button variant="outlined" onClick={onCancel}>
                Cancel
              </Button>
            )}
            <Button variant="contained" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save Config'}
            </Button>
          </Box>
        </Box>

        <Dialog open={clearDialogOpen} onClose={() => setClearDialogOpen(false)}>
          <DialogTitle>Clear All Local Data</DialogTitle>
          <DialogContent>
            <DialogContentText>
              This will delete all stored configuration, read status, and cached log files.
              You will need to reconfigure GitHub settings. This action cannot be undone.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setClearDialogOpen(false)}>Cancel</Button>
            <Button variant="contained" color="error" onClick={handleClear}>
              Clear All Data
            </Button>
          </DialogActions>
        </Dialog>
      </Stack>
    </Container>
  );
};

export default ConfigPage;
