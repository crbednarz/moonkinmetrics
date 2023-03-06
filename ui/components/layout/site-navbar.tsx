import {SPEC_BY_CLASS} from "@/lib/wow";
import { MantineTheme, Navbar, NavLink } from "@mantine/core";
import {useRouter} from "next/router";

interface SiteNavbarProps {
  opened: boolean,
}

export default function SiteNavbar({
  opened,
}: SiteNavbarProps) {
  const router = useRouter();
  const { class_name: classParam, spec_name: specParam, bracket } = router.query;
  
  return (
    <Navbar
      p="md"
      hiddenBreakpoint="lg"
      width={{ sm: 200, lg: 200 }}
      withBorder={false}
      hidden={!opened}
    >
      <Navbar.Section>
        {Object.keys(SPEC_BY_CLASS).map(wowClass => (
          <NavLink
            defaultOpened={classParam == wowClass}
            key={wowClass}
            label={wowClass}
            sx={theme => ({
              color: colorFromClass(wowClass, theme)
            })}
          >
            {SPEC_BY_CLASS[wowClass].map(spec => (
              <NavLink key={spec} label={spec}
                active={classParam == wowClass && specParam == spec}
                sx={theme => ({
                  color: colorFromClass(wowClass, theme)
                })}
                onClick={() => {
                  router.push(`/${wowClass}/${spec}/${bracket ?? 'Shuffle'}`.replace(' ', '-'));
                }}
              />
            ))}
            </NavLink>
        ))}
      </Navbar.Section>
    </Navbar>
  );
}

function colorFromClass(wowClass: string, theme: MantineTheme) {
  return theme.colors[wowClass.toLowerCase().replace(' ', '-')];
}
