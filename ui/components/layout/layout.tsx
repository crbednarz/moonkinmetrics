import { useState } from 'react';
import {
  AppShell,
  rem,
  Image,
  Header,
  MediaQuery,
  Burger,
  Title,
  useMantineTheme,
  Flex,
  createStyles,
  Space,
  Anchor,
  Alert,
  Box,
} from '@mantine/core';
import Link from 'next/link';
import {colorToStyle, globalColors} from '@/lib/style-constants';

const useStyles = createStyles(theme => ({
  logo: {
    alignContent: 'center',
    alignItems: 'center',
    textAlign: 'left',
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
  const theme = useMantineTheme();
  const [opened, setOpened] = useState(false);
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
              <Flex className={classes.logo}>
                <Image src="/logo.svg" alt="Moonkin Metrics" width={120} height={120} fit="contain" />
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
            <MediaQuery largerThan="lg" styles={{ display: 'none' }}>
              <Burger
                opened={opened}
                onClick={() => setOpened(o => !o)}
                size="sm"
                color={theme.colors.gray[6]}
                mr="xl"
              />
            </MediaQuery>
          </Flex>
        </Header>
      }
    >
      {children}
    </AppShell>
  );
}
