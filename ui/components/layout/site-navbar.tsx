import {SPEC_BY_CLASS} from "@/lib/wow";
import { Navbar } from "@mantine/core";

interface SiteNavbarProps {
  opened: boolean,
}

export default function SiteNavbar({
  opened,
}: SiteNavbarProps) {
  
  return (
    <Navbar
      p="md"
      hiddenBreakpoint="lg"
      width={{ sm: 200, lg: 200 }}
      withBorder={false}
      hidden={!opened}
    >
      {Object.keys(SPEC_BY_CLASS).map(wowClass => (
        <Navbar.Section
          key={wowClass}
          sx={theme => ({
            color: theme.colors[wowClass.toLowerCase().replace(' ', '-')]
          })}
        >
          {wowClass}
        </Navbar.Section>
      ))}
    </Navbar>
  );
}
