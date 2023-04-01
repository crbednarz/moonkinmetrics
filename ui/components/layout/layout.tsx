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
  Button,
  Box,
  MediaQuery,
  Center,
} from '@mantine/core';
import Link from 'next/link';
import { colorToStyle, globalColors } from '@/lib/style-constants';
import { IconExternalLink } from '@tabler/icons-react';

const useStyles = createStyles(theme => ({
  logoWrapper: {
    alignContent: 'center',
    alignItems: 'center',
    textAlign: 'left',
    height: rem(120),
    marginRight: rem(20),
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

  const headerLinks = [
    {
      title: "Home",
      href: "/",
    },
    {
      title: "Talents",
      href: "/talents",
    },
    {
      title: "GitHub",
      href: "https://github.com/crbednarz/moonkinmetrics",
      rightIcon: (<IconExternalLink />),
      target: "_blank",
    },
  ];


  const notice = (
    <Alert title="NOTICE" color="primary.9" style={{textAlign: 'left'}} maw={400}>
      Moonkin Metrics is currently in beta and changing frequently.
      If you have any feedback, please reach out on{' '}
      <Anchor color="blue" href="https://github.com/crbednarz/moonkinmetrics/discussions" target="_blank">GitHub</Anchor>{' '}or{' '}
      <Anchor color="blue" href="https://discord.gg/d4stUFRY" target="_blank">Discord</Anchor>.
    </Alert>
  );

  const header = (
    <Header height="100%" withBorder={false} className={classes.headerWrapper}>
      <Flex className={classes.headerContent}>
        <Flex align="center" wrap="wrap" justify="center">
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
          <Box>

          {headerLinks.map(link => (
            <Button
              key={link.title}
              color="primary"
              variant="subtle"
              component="a"
              size="lg"
              href={link.href}
              rightIcon={link.rightIcon}
              target={link.target}
              sx={theme => ({
                [`@media (max-width: ${theme.breakpoints.xs})`]: {
                  padding: '0 12px',
                  margin: '4px 0',
                  height: 34,
                },
              })}
            >
              {link.title}
            </Button>
          ))}
          </Box>
        </Flex>
        <MediaQuery smallerThan="xs" styles={{display: 'none'}}>
          {notice}
        </MediaQuery>
      </Flex>
    </Header>
  );

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
      header={header}
      footer={
        <MediaQuery largerThan="xs" styles={{display: 'none'}}>
          <Center>
            <Box m={10} display="inline-block">
              {notice}
            </Box>
          </Center>
        </MediaQuery>
      }
    >
      {children}
    </AppShell>
  );
}
