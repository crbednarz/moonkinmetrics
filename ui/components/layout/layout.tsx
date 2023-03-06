import { useState } from 'react';
import {
  AppShell,
  rem,
  Header,
  MediaQuery,
  Burger,
  Title,
  useMantineTheme,
  Flex,
} from '@mantine/core';
import SiteNavbar from './site-navbar';

export default function Layout({
  children,
  className,
}: {
  children: React.ReactNode,
  className?: string
}) {
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
            [`@media (max-width: ${theme.breakpoints.lg})`]: {
              justifyContent: 'space-between',
              '& > *': {
                'margin': rem(10),
              },
            },
          })}>
            <Title>@ [APP NAME]</Title>
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
