import React from 'react';
import { Box, Text } from 'ink';

export interface StatusViewProps {
  title: string;
  details?: string;
}

export function StatusView({ title, details }: StatusViewProps): React.ReactElement {
  return (
    <Box flexDirection="column">
      <Text color="green">{title}</Text>
      {details ? <Text color="gray">{details}</Text> : null}
    </Box>
  );
}
