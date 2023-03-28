import { createStyles, rem } from '@mantine/core';

const useStyles = createStyles(theme => ({
  wrapper: {
    marginLeft: rem(20),
    marginRight: rem(20),
    height: 'auto',
    [`@media (max-width: ${theme.breakpoints.md})`]: {
      margin: 0,
    },
  },
  innerWrapper: {
    position: 'sticky',
    top: rem(7),
    width: rem(400),
    [`@media (max-width: ${theme.breakpoints.md})`]: {
      display: 'none',
    },
  },
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
      <div className={`${classes.innerWrapper}`}>
        {children}
      </div>
    </div>
  );
}
