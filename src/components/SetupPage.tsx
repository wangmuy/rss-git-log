import React, { useState } from 'react';
import {
  Container,
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  Divider,
  Link,
  Card,
  CardContent,
  Grid,
} from '@mui/material';
import { saveConfig } from '../utils/github-api';

interface SetupFormData {
  owner: string;
  repo: string;
  branch: string;
  token: string;
}

interface SetupPageProps {
  onConfigured?: () => void;
}

export const SetupPage: React.FC<SetupPageProps> = ({ onConfigured }) => {
  const [formData, setFormData] = useState<SetupFormData>({
    owner: '',
    repo: '',
    branch: 'main',
    token: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleChange = (field: keyof SetupFormData) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  const handleSave = async () => {
    setError(null);
    setSaving(true);

    try {
      // Validate required fields
      if (!formData.owner.trim() || !formData.repo.trim()) {
        throw new Error('GitHub owner and repository are required');
      }

      // Save configuration to localStorage
      saveConfig({
        owner: formData.owner.trim(),
        repo: formData.repo.trim(),
        branch: formData.branch.trim() || 'main',
        token: formData.token.trim() || undefined,
      });

      // Show success message
      alert('Configuration saved! You can now use the RSS reader.');

      // Navigate back to main page (will re-check config)
      if (onConfigured) {
        onConfigured();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom fontWeight="bold">
          RSS Reader Setup
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Configure your GitHub repository to get started with GitHub-powered RSS reading
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Instructions */}
        <Grid size={{ xs: 12, md: 5 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                Setup Instructions
              </Typography>
              <Typography variant="body2" paragraph>
                Before continuing, you need to:
              </Typography>
              <ol style={{ paddingLeft: '20px', lineHeight: '1.8' }}>
                <li>
                  <Link href="https://github.com/new" target="_blank" rel="noopener">
                    Create a public GitHub repository
                  </Link>
                </li>
                <li>
                  Add a file named <code>rss-config.json</code> to the repo
                </li>
                <li>
                  Create a <code>logs/</code> folder (optional, auto-created)
                </li>
                <li>
                  Get a{' '}
                  <Link href="https://github.com/settings/tokens" target="_blank" rel="noopener">
                    Personal Access Token
                  </Link>{' '}
                  (for write access)
                </li>
              </ol>

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle2" gutterBottom fontWeight="bold">
                Example rss-config.json:
              </Typography>
              <Paper
                sx={{
                  p: 2,
                  bgcolor: 'grey.100',
                  fontSize: '0.75rem',
                  overflowX: 'auto',
                  fontFamily: 'monospace',
                }}
                variant="outlined"
              >
                {JSON.stringify(
                  {
                    sites: [
                      {
                        name: 'Tech News',
                        url: 'https://example.com/rss',
                        color: '#2196F3',
                      },
                    ],
                    settings: {
                      showReadItems: false,
                      autoCommit: true,
                      commitInterval: 300,
                    },
                  },
                  null,
                  2
                )}
              </Paper>
            </CardContent>
          </Card>
        </Grid>

        {/* Form */}
        <Grid size={{ xs: 12, md: 7 }}>
          <Paper sx={{ p: 3 }} elevation={3}>
            <Typography variant="h6" gutterBottom fontWeight="bold">
              GitHub Configuration
            </Typography>

            <Box component="form" noValidate autoComplete="off" sx={{ '& > :not(style)': { mb: 2 } }}>
              <TextField
                label="GitHub Owner (Username/Org)"
                fullWidth
                required
                value={formData.owner}
                onChange={handleChange('owner')}
                placeholder="your-username"
                helperText="The owner of the GitHub repository"
              />

              <TextField
                label="Repository Name"
                fullWidth
                required
                value={formData.repo}
                onChange={handleChange('repo')}
                placeholder="rss-reader-data"
                helperText="The name of your GitHub repository"
              />

              <TextField
                label="Branch Name"
                fullWidth
                value={formData.branch}
                onChange={handleChange('branch')}
                placeholder="main"
                helperText="Default: main"
              />

              <TextField
                label="GitHub Token (Optional for public repos)"
                fullWidth
                type="password"
                value={formData.token}
                onChange={handleChange('token')}
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                helperText="Required for write operations (committing read status)"
              />

              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  <strong>Note:</strong> For public repositories, you can read feeds without a token.
                  A token is only needed to commit read status to your logs.
                </Typography>
              </Alert>

              <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                <Button
                  variant="contained"
                  color="primary"
                  size="large"
                  onClick={handleSave}
                  disabled={saving}
                  fullWidth
                >
                  {saving ? 'Saving...' : 'Save Configuration'}
                </Button>
                <Button
                  variant="outlined"
                  color="secondary"
                  size="large"
                  onClick={() => {
                    if (onConfigured) onConfigured();
                  }}
                  fullWidth
                >
                  Cancel
                </Button>
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default SetupPage;
