import {
  AppShell,
  rem,
  Image,
  Header,
  Title,
  Flex,
  createStyles,
  Space,
  Anchor,
  Alert,
} from '@mantine/core';
import Link from 'next/link';
import { colorToStyle, globalColors } from '@/lib/style-constants';

const useStyles = createStyles(theme => ({
  logoWrapper: {
    alignContent: 'center',
    alignItems: 'center',
    textAlign: 'left',
    height: rem(120),
    '& > h1': {
      paddingTop: rem(15),
      fontSize: rem(40),
      lineHeight: rem(30),
    },
  },
  headerWrapper: {
    marginBottom: rem(20),
    backgroundColor: colorToStyle(globalColors.dark[8], 0.4),
    borderBottom: `1px solid ${theme.colors.dark[6]}`,
    height: '100%',
    padding: rem(10),
    [`@media (max-width: ${theme.breakpoints.lg})`]: {
      justifyContent: 'space-between',
      '& > *': {
        'margin': rem(10),
      },
    },
  },
  headerContent: {
    margin: '0 auto',
    boxSizing: 'content-box',
    maxWidth: theme.breakpoints.xl,
    alignItems: 'center',
    justifyContent: 'space-between',
    [`@media (max-width: ${theme.breakpoints.xl})`]: {
      maxWidth: theme.breakpoints.lg,
    },
    [`@media (max-width: ${theme.breakpoints.xs})`]: {
      flexDirection: 'column',
      rowGap: rem(10),
    }
  },
  link: {
    display: 'block',
    lineHeight: 1,
    padding: `${rem(8)} ${rem(12)}`,
    borderRadius: theme.radius.sm,
    textDecoration: 'none',
    color: theme.colors.dark[0],
    fontSize: theme.fontSizes.lg,
    fontWeight: 500,
    '&:hover': {
      backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[6] : theme.colors.gray[0],
    },
  },

}));

export default function Layout({
  children,
  className,
}: {
  children: React.ReactNode,
  className?: string
}) {
  const { classes } = useStyles();
  return (
    <AppShell
      navbarOffsetBreakpoint="lg"
      className={className}
      fixed={false}
      padding={0}
      sx={() => ({
        textAlign: 'center',
        '& main > *,& nav > *': {
          textAlign: 'left',
        }
      })}
      header={
        <Header height={{ }} withBorder={false} className={classes.headerWrapper}>
          <Flex className={classes.headerContent}>
            <Link href="/">
              <Flex className={classes.logoWrapper}>
                <Image
                  width={120}
                  height={120}
                  src="/logo.svg"
                  alt="Moonkin Metrics"
                  fit="contain"
                />
                <Title>
                  Moonkin
                  <Space h="xs" />
                  Metrics
                </Title>
              </Flex>
            </Link>
            <Alert title="NOTICE" color="primary.9" style={{textAlign: 'left'}}>
              This is under active development and changing frequently!<br/>
              If you have any feedback, please reach out on&nbsp;
              <Anchor color="blue" href="https://github.com/crbednarz/moonkinmetrics" target="_blank">Github</Anchor>&nbsp;or&nbsp;
              <Anchor color="blue" href="https://discord.gg/d4stUFRY" target="_blank">Discord</Anchor>.
            </Alert>
          </Flex>
        </Header>
      }
    >
      {children}
    </AppShell>
  );
}
