import { createStyles, rem, Stack } from '@mantine/core';

const useStyles = createStyles(() => ({
  wrapper: {
    marginLeft: rem(20),
    marginRight: rem(20),
    height: 'auto',
  },
  innerWrapper: {
    position: 'sticky',
    top: rem(7),
  }
}));

type InfoPanelProps = React.PropsWithChildren<{
  className?: string;
}>;

export default function InfoPanel({
    children,
    className,
}: InfoPanelProps) {
  const { classes } = useStyles();
  return (
    <div className={`${classes.wrapper} ${className}`}>
      <div className={classes.innerWrapper}>
        <Stack>
          {children}
        </Stack>
      </div>
    </div>
  );
}
