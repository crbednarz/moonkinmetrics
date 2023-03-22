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
} from '@mantine/core';
import SiteNavbar from './site-navbar';

const useStyles = createStyles(theme => ({
  logo: {
    alignContent: 'center',
    alignItems: 'center',
    textAlign: 'left',
    '& > h1': {
      paddingTop: rem(15),
      fontSize: rem(40),
      lineHeight: rem(30),
    }
  }
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
      navbar={
        <SiteNavbar
          opened={opened}
        />
      }
      sx={() => ({
        textAlign: 'center',
        '& main > *,& nav > *': {
          textAlign: 'left',
        }
      })}
      header={
        <Header height={{ }} withBorder={false}>
          <Flex sx={() => ({
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            padding: rem(10),
            [`@media (max-width: ${theme.breakpoints.lg})`]: {
              justifyContent: 'space-between',
              '& > *': {
                'margin': rem(10),
              },
            },
          })}>
            <Flex className={classes.logo}>
              <Image src="/logo.svg" alt="Moonkin Metrics" width={120} height={120} />
              <Title>
                Moonkin
                <Space h="xs" />
                Metrics
              </Title>
            </Flex>
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
