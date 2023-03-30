import {colorToStyle, globalColors, lerpColors} from "@/lib/style-constants";
import { SPEC_BY_CLASS } from "@/lib/wow";
import { Box, Button, Card, createStyles, Flex, MantineTheme, Menu, rem, Text, Title, useMantineTheme } from "@mantine/core";
import { useRouter } from "next/router";

const useStyles = createStyles(theme => ({
  wrapper: {
    gap: 20,
    justifyContent: 'center',
    backgroundColor: colorToStyle(globalColors.dark[8], 0.2),
    padding: 20,
    borderRadius: theme.radius.md,
  },
  title: {
    padding: '8px 16px',
    backgroundColor: theme.colors.dark[6],
    borderRadius: theme.radius.sm,
    width: '100%',
    textAlign: 'center',
  },
  link: {
    display: 'block',
    padding: '8px 12px',
    fontWeight: 500,
    borderRadius: theme.radius.sm,
    textDecoration: 'none',
    '&:hover': {
      backgroundColor: theme.colors.dark[6],
    },
  },
  card: {
    display: 'flex',
    gap: 5,
    flexDirection: 'column',
    alignItems: 'center',
    width: rem(200),
    height: rem(200),
    borderRadius: theme.radius.md,
    '& > h3': {
      margin: 0,
    },
  }
}));

interface SiteNavProps {
}

export default function SiteNav({
}: SiteNavProps) {
  const router = useRouter();

  const { classes } = useStyles();
  
  return (
    <Flex className={classes.wrapper} wrap="wrap">
      {Object.keys(SPEC_BY_CLASS).map(wowClass => (
        <Box
          className={classes.card}
          key={wowClass}
        >
          <Title
            className={classes.title}
            sx={theme => ({
              color: colorFromClass(wowClass, theme)
            })}
            order={3}
          >
            {wowClass}
          </Title>
          {SPEC_BY_CLASS[wowClass].map(spec => (
            <Box key={spec}>
              <Button
                key={spec}
                variant="subtle"
                color={wowClass.toLowerCase().replace(' ', '-')}
                sx={theme => ({
                  color: colorFromClass(wowClass, theme)
                })}
                onClick={() => {
                  router.push(`/${wowClass}/${spec}/${'3v3'}/`.replace(' ', '-'));
                }}
              >
                {spec}
              </Button>
            </Box>
          ))}
        </Box>
      ))}
    </Flex>
  );
}

function colorFromClass(wowClass: string, theme: MantineTheme) {
  return theme.colors[wowClass.toLowerCase().replace(' ', '-')];
}
