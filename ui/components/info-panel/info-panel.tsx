import { createStyles, getStylesRef, rem, Stack } from '@mantine/core';

interface InfoPanelProps {
  children: React.ReactNode,
}

const useStyles = createStyles(theme => ({
  wrapper: {
    minWidth: rem(500),
    marginLeft: rem(20),
    height: 'auto',
  },
  innerWrapper: {
    position: 'sticky',
    top: rem(7),
    height: rem(300),
  }
}));

export default function InfoPanel({
    children,
}: InfoPanelProps) {
  const { classes } = useStyles();
  return (
    <div className={classes.wrapper}>
      <div className={classes.innerWrapper}>
        <Stack>
          {children}
        </Stack>
      </div>
    </div>
  );
}
