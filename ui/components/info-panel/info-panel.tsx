import { createStyles, getStylesRef, rem, Stack } from '@mantine/core';

type InfoPanelProps = React.PropsWithChildren<{}>;

const useStyles = createStyles(() => ({
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
