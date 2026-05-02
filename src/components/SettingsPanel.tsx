import React from 'react';
import {
  Paper,
  Box,
  Typography,
  FormControlLabel,
  Switch,
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

      </Stack>

      <Box sx={{ mt: 1 }}>
        <Typography variant="caption" color="text.secondary">
          Changes are saved automatically to browser storage
        </Typography>
      </Box>
    </Paper>
  );
};
