import { SPEC_BY_CLASS } from "@/lib/wow";
import { Box, createStyles, Flex, MantineTheme, Menu, NavLink } from "@mantine/core";
import { useRouter } from "next/router";

const useStyles = createStyles(theme => ({
  wrapper: {
    maxWidth: '600px',
    alignItems: 'center',
    justifyContent: 'center',

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
  }
}));

interface SiteNavProps {
}

export default function SiteNav({
}: SiteNavProps) {
  const router = useRouter();
  const classParam: string = (router.query.class_name ?? '') as string;
  const specParam: string = (router.query.spec_name ?? '') as string;
  const bracket: string = router.query.bracket as string;

  const { classes } = useStyles();
  
  return (
    <Flex className={classes.wrapper} wrap="wrap">
      {Object.keys(SPEC_BY_CLASS).map(wowClass => (
        <Menu key={wowClass} trigger="hover">
          <Menu.Target>
            <Box className={classes.link}
              sx={theme => ({
                color: colorFromClass(wowClass, theme)
              })}
            >
              <span>{wowClass}</span>
            </Box>
          </Menu.Target>
          <Menu.Dropdown>
            {SPEC_BY_CLASS[wowClass].map(spec => (
              <Menu.Item
                key={spec}
                sx={theme => ({
                  color: colorFromClass(wowClass, theme)
                })}
                onClick={() => {
                  router.push(`/${wowClass}/${spec}/${bracket ?? '3v3'}/`.replace(' ', '-'));
                }}
              >
                {spec}
              </Menu.Item>
            ))}
          </Menu.Dropdown>
        </Menu>
      ))}
    </Flex>
  );
}

function colorFromClass(wowClass: string, theme: MantineTheme) {
  return theme.colors[wowClass.toLowerCase().replace(' ', '-')];
}

function isParamMatch(name: string, param: string) {
  return name.toLowerCase().replace(' ', '-') == param.toLowerCase();
}

