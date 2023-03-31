import { SPEC_BY_CLASS } from "@/lib/wow";
import { createStyles, getStylesRef, Menu, rem, Title, UnstyledButton } from "@mantine/core";
import { IconChevronRight } from "@tabler/icons-react";
import {useRouter} from "next/router";

const useStyles = createStyles(theme => ({
  title: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 500,
    borderRadius: theme.radius.sm,
    padding: '8px 0px 8px 12px',
    fontSize: '2.5rem',
    [`&.${getStylesRef('titleLink')}:hover`]: {
      backgroundColor: theme.colors.dark[6],
    },
    [`@media (min-width: ${theme.breakpoints.lg})`]: {
      padding: '8px 12px',
    }
  },
  titleLink: {
    ref: getStylesRef('titleLink'),
  },
  chevron: {
    color: theme.colors.primary[5],
    marginLeft: rem(15),
    [`@media (min-width: ${theme.breakpoints.lg})`]: {
      display: 'none',
    },
  },
  link: {
    display: 'block',
    padding: '4px 6px',
    fontWeight: 500,
    borderRadius: theme.radius.xl,
    textDecoration: 'none',
    '&:hover': {
      backgroundColor: theme.colors.dark[6],
    },
  },
  dropdown: {
    display: 'flex',
    flexDirection: 'column',
    flexWrap: 'wrap',
    maxHeight: '500px',
    overflow: 'auto',
  }
}));

interface SpecSelectorProps {
}

export default function SpecSelector({
}: SpecSelectorProps) {
  const router = useRouter();
  const classParam: string = (router.query.class_name ?? '') as string;
  const specParam: string = (router.query.spec_name ?? '') as string;
  const bracket: string = router.query.bracket as string;

  const { classes } = useStyles();

  
  return (
    <Menu withArrow disabled={false}>
      <Menu.Target>
        <UnstyledButton className={classes.title}>
          <Title>{specParam.replace('-', ' ')}&nbsp;</Title>
          <Title color="wow-class">{classParam.replace('-', ' ')}</Title>
          <IconChevronRight className={classes.chevron} size="2.125rem"/>
        </UnstyledButton>
      </Menu.Target>
      <Menu.Dropdown className={classes.dropdown}>
        {Object.keys(SPEC_BY_CLASS).map(wowClass => (
          <>
            <Menu.Label key={wowClass}>{wowClass}</Menu.Label>
            {SPEC_BY_CLASS[wowClass].map(spec => (
              <Menu.Item
                key={spec}
                color={wowClass.toLowerCase().replace(' ', '-')}
                onClick={() => {
                  router.push(`/${wowClass}/${spec}/${bracket ?? '3v3'}/`.replace(' ', '-'));
                }}
              >
                {`${spec} ${wowClass}`}
              </Menu.Item>
            ))}
          </>
        ))}
      </Menu.Dropdown>
    </Menu>
  );
}
