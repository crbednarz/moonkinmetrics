import { SPEC_BY_CLASS } from "@/lib/wow";
import { MantineTheme, Navbar, NavLink } from "@mantine/core";
import { useRouter } from "next/router";

interface SiteNavbarProps {
}

export default function SiteNavbar({
}: SiteNavbarProps) {
  const router = useRouter();
  const classParam: string = (router.query.class_name ?? '') as string;
  const specParam: string = (router.query.spec_name ?? '') as string;
  const bracket: string = router.query.bracket as string;
  
  return (
    <Navbar
      p="md"
      width={{ sm: 200, lg: 200 }}
      withBorder={false}
    >
      <Navbar.Section>
        {Object.keys(SPEC_BY_CLASS).map(wowClass => (
          <NavLink
            defaultOpened={isParamMatch(wowClass, classParam)}
            key={wowClass}
            label={wowClass}
            sx={theme => ({
              color: colorFromClass(wowClass, theme),
            })}
          >
            {SPEC_BY_CLASS[wowClass].map(spec => (
              <NavLink
                key={spec}
                label={spec}
                active={isParamMatch(wowClass, classParam) && isParamMatch(spec, specParam)}
                sx={theme => ({
                  color: colorFromClass(wowClass, theme),
                })}
                color={wowClass.toLowerCase().replace(' ', '-')}
                onClick={() => {
                  router.push(`/${wowClass}/${spec}/${bracket ?? '3v3'}/`.replace(' ', '-'));
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

function isParamMatch(name: string, param: string) {
  return name.toLowerCase().replace(' ', '-') == param.toLowerCase();
}
