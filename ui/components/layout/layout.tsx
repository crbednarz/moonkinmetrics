import { useState } from 'react';
import {
  AppShell,
  Container,
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
      navbarOffsetBreakpoint="sm"
      className={className}
      fixed={false}
      padding={0}
      navbar={
        <SiteNavbar
          opened={opened}
        />
      }
      header={
        <Header height={{ }} withBorder={false}>
          <Flex sx={() => ({
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            [`@media (max-width: ${theme.breakpoints.sm})`]: {
              justifyContent: 'space-between',
              '& > *': {
                'margin': rem(10),
              },
            },
          })}>
            <Title>@ [APP NAME]</Title>
            <MediaQuery largerThan="sm" styles={{ display: 'none' }}>
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
      <Container style={{padding: '0'}} size={rem(1300)}>
        {children}
      </Container>
    </AppShell>
  );
}
