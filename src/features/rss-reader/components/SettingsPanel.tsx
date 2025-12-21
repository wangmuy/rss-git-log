import React from 'react';
import {
  Paper,
  Box,
  Typography,
  FormControlLabel,
  Switch,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Stack
} from '@mui/material';
import { ReaderSettings } from '@/types/config';

interface SettingsPanelProps {
  settings: ReaderSettings;
  onSettingsChange: (settings: Partial<ReaderSettings>) => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  settings,
  onSettingsChange
}) => {
  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
        Settings
      </Typography>

      <Stack spacing={2}>
        <FormControlLabel
          control={
            <Switch
              checked={settings.showReadItems}
              onChange={(e) => onSettingsChange({ showReadItems: e.target.checked })}
              color="primary"
            />
          }
          label="Show Read Items"
        />

        <FormControlLabel
          control={
            <Switch
              checked={settings.autoCommit}
              onChange={(e) => onSettingsChange({ autoCommit: e.target.checked })}
              color="primary"
            />
          }
          label="Auto-commit to GitHub"
        />

        {settings.autoCommit && (
          <Box sx={{ pl: 3 }}>
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Commit Interval</InputLabel>
              <Select
                value={settings.commitInterval}
                onChange={(e) => onSettingsChange({ commitInterval: Number(e.target.value) })}
                label="Commit Interval"
              >
                <MenuItem value={60}>1 minute</MenuItem>
                <MenuItem value={300}>5 minutes</MenuItem>
                <MenuItem value={600}>10 minutes</MenuItem>
                <MenuItem value={900}>15 minutes</MenuItem>
                <MenuItem value={1800}>30 minutes</MenuItem>
              </Select>
            </FormControl>
          </Box>
        )}
      </Stack>

      <Box sx={{ mt: 1 }}>
        <Typography variant="caption" color="text.secondary">
          Changes are saved automatically to browser storage
        </Typography>
      </Box>
    </Paper>
  );
};