import { createStyles, getStylesRef, rem, Stack } from '@mantine/core';

type InfoPanelProps = React.PropsWithChildren<{}>;

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
