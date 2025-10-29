import type { IconButtonProps } from '@mui/material/IconButton';

import { useState, useEffect, useCallback } from 'react';
import type { MouseEvent } from 'react';
import settingsIcon from '@iconify-icons/solar/settings-bold-duotone';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import SvgIcon from '@mui/material/SvgIcon';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import Popover from '@mui/material/Popover';
import { alpha, styled, useTheme } from '@mui/material/styles';

import { paths } from 'src/routes/paths';
import { useRouter, usePathname } from 'src/routes/hooks';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { AnimateAvatar } from 'src/components/animate';

import { getOrgLogo, getOrgIdFromToken } from 'src/sections/accountdetails/utils';

import { useAuthContext } from 'src/auth/hooks';

import { AccountButton } from './account-button';
import { SignOutButton } from './sign-out-button';
// ----------------------------------------------------------------------

const AccountLabel = styled(Label)(({ theme }) => {
  const isDark = theme.palette.mode === 'dark';
  return {
    marginTop: 1.5,
    padding: '0px 8px',
    paddingTop: '4px',
    paddingBottom: '4px',
    fontSize: '0.7rem',
    fontWeight: 500,
    borderRadius: '4px',
    letterSpacing: '0.02em',
    backgroundColor: isDark
      ? alpha(theme.palette.primary.main, 0.16)
      : alpha(theme.palette.primary.main, 0.08),
    color: isDark
      ? alpha(theme.palette.primary.main, 0.9)
      : theme.palette.primary.main,
  };
});

const MenuItemStyled = styled(MenuItem, {
  shouldForwardProp: (prop) => prop !== 'isActive' && prop !== 'isDark',
})<{ isActive: boolean; isDark: boolean }>(({ theme, isActive, isDark }) => ({
  height: 44,
  borderRadius: 1.5,
  marginBottom: 0.5,
  padding: '8px 12px',
  color: isActive ? theme.palette.primary.main : theme.palette.text.secondary,
  backgroundColor: isActive
    ? isDark
      ? alpha(theme.palette.primary.main, 0.16)
      : alpha(theme.palette.primary.main, 0.08)
    : 'transparent',
  '& svg': {
    width: 20,
    height: 20,
    color: isActive ? theme.palette.primary.main : theme.palette.text.secondary,
    opacity: isDark ? 0.9 : 0.7,
  },
  '&:hover': {
    backgroundColor: isActive
      ? isDark
        ? alpha(theme.palette.primary.main, 0.24)
        : alpha(theme.palette.primary.main, 0.12)
      : isDark
        ? alpha(theme.palette.action.hover, 0.4)
        : theme.palette.action.hover,
    color: isActive ? theme.palette.primary.main : theme.palette.text.primary,
  },
  transition: 'all 0.2s ease-in-out',
}));

const IconContainer = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'isActive' && prop !== 'isDark',
})<{ isActive: boolean; isDark: boolean }>(({ theme, isActive, isDark }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 32,
  height: 32,
  marginRight: 1.5,
  borderRadius: 1,
  backgroundColor: isActive
    ? isDark
      ? alpha(theme.palette.primary.main, 0.24)
      : alpha(theme.palette.primary.main, 0.12)
    : isDark
      ? alpha(theme.palette.action.hover, 0.2)
      : alpha(theme.palette.action.hover, 0.4),
}));

// Base account menu items
const baseAccountItems = [
  {
    label: 'Manage my profile',
    href: '/account/company-settings/personal-profile',
    icon: (
      <SvgIcon>
        <path
          opacity="0.5"
          d="M2.28099 19.6575C2.36966 20.5161 2.93261 21.1957 3.77688 21.3755C5.1095 21.6592 7.6216 22 12 22C16.3784 22 18.8905 21.6592 20.2232 21.3755C21.0674 21.1957 21.6303 20.5161 21.719 19.6575C21.8505 18.3844 22 16.0469 22 12C22 7.95305 21.8505 5.6156 21.719 4.34251C21.6303 3.48389 21.0674 2.80424 20.2231 2.62451C18.8905 2.34081 16.3784 2 12 2C7.6216 2 5.1095 2.34081 3.77688 2.62451C2.93261 2.80424 2.36966 3.48389 2.28099 4.34251C2.14952 5.6156 2 7.95305 2 12C2 16.0469 2.14952 18.3844 2.28099 19.6575Z"
          fill="currentColor"
        />
        <path
          d="M13.9382 13.8559C15.263 13.1583 16.1663 11.7679 16.1663 10.1666C16.1663 7.8655 14.3008 6 11.9996 6C9.69841 6 7.83291 7.8655 7.83291 10.1666C7.83291 11.768 8.73626 13.1584 10.0612 13.856C8.28691 14.532 6.93216 16.1092 6.51251 18.0529C6.45446 18.3219 6.60246 18.5981 6.87341 18.6471C7.84581 18.8231 9.45616 19 12.0006 19C14.545 19 16.1554 18.8231 17.1278 18.6471C17.3977 18.5983 17.5454 18.3231 17.4876 18.0551C17.0685 16.1103 15.7133 14.5321 13.9382 13.8559Z"
          fill="currentColor"
        />
      </SvgIcon>
    ),
  },
];

// Company settings menu item (only for business accounts)
const companySettingsItem = {
  label: 'Company Settings',
  href: '/account/company-settings/profile',
  icon: <Iconify icon={settingsIcon} />,
};

export type AccountDrawerProps = IconButtonProps & {
  data?: {
    label: string;
    href: string;
    icon?: React.ReactNode;
    info?: React.ReactNode;
  }[];
};

export function AccountDrawer({ data = [], sx, ...other }: AccountDrawerProps) {
  const theme = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuthContext();
  const isDark = theme.palette.mode === 'dark';

  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [menuItems, setMenuItems] = useState(data);
  const [customLogo, setCustomLogo] = useState<string | null>('');
  const isBusiness =
    user?.accountType === 'business' ||
    user?.accountType === 'organization' ||
    user?.role === 'business';
    
  useEffect(() => {
    const fetchLogo = async () => {
      try {
        const orgId = await getOrgIdFromToken();
        if (isBusiness) {
          const logoUrl = await getOrgLogo(orgId);
          setCustomLogo(logoUrl);
        }
      } catch (err) {
        console.error(err, 'error in fetching logo');
      }
    };
    fetchLogo();
  }, [isBusiness]);

  // Build menu items when user data changes
  useEffect(() => {
    // If data is provided through props, use it
    if (data && data.length > 0) {
      setMenuItems(data);
      return;
    }

    // Otherwise build based on account type
    const items = [...baseAccountItems];

    if (isBusiness) {
      items.push(companySettingsItem);
    }

    setMenuItems(items);
  }, [data, isBusiness]);

  const handleOpenPopover = useCallback((event: MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  }, []);

  const handleClosePopover = useCallback(() => {
    setAnchorEl(null);
  }, []);

  const handleClickItem = useCallback(
    (path: string) => {
      handleClosePopover();
      router.push(path);
    },
    [handleClosePopover, router]
  );

  const renderAvatar = (
    <AnimateAvatar
      width={56}
      slotProps={{
        avatar: { src: user?.photoURL, alt: user?.displayName },
        overlay: {
          border: isDark ? 0 : 1,
          spacing: 1.5,
          color: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)} 15%, ${alpha(theme.palette.primary.main, 0.7)} 100%)`,
        },
      }}
    >
      {user?.displayName?.charAt(0).toUpperCase() || user?.fullName?.charAt(0).toUpperCase() || 'U'}
    </AnimateAvatar>
  );

  // Use a theme-derived background color for dark mode
  const darkModeGradient = `linear-gradient(180deg, ${alpha(theme.palette.grey[900], 0.8)} 0%, ${alpha(theme.palette.grey[900], 0.95)} 100%)`;

  const open = Boolean(anchorEl);

  return (
    <>
      <AccountButton
        onClick={handleOpenPopover}
        photoURL={customLogo || user?.photoURL}
        displayName={user?.fullName}
        sx={sx}
        {...other}
      />

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClosePopover}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{
          paper: {
            sx: {
              width: 320,
              borderRadius: 2,
              boxShadow: 'none',
              backgroundColor: isDark
                ? alpha(theme.palette.background.default, 0.98)
                : theme.palette.background.paper,
              backgroundImage: isDark ? darkModeGradient : 'none',
              border: `1px solid ${alpha(theme.palette.divider, isDark ? 0.6 : 0.4)}`,
              overflow: 'visible',
              p: 0,
            },
          },
        }}
      >
        <Box sx={{ px: 2.25, pt: 2.25, pb: 2 }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            {renderAvatar}

            <Box sx={{ minWidth: 0 }}>
              <Typography variant="subtitle1" noWrap sx={{ fontWeight: 600, letterSpacing: '0.01em' }}>
                {user?.fullName || user?.displayName}
              </Typography>

              <Typography
                variant="body2"
                sx={{ color: 'text.secondary', mt: 0.25, fontSize: '0.8125rem', opacity: 0.85 }}
                noWrap
              >
                {user?.email}
              </Typography>

              {user?.accountType && (
                <AccountLabel
                  sx={{ mt: 1 }}
                  color={
                    user.accountType === 'business' || user.accountType === 'organization'
                      ? 'primary'
                      : 'info'
                  }
                >
                  {user.accountType === 'business' || user.accountType === 'organization'
                    ? 'Business Account'
                    : 'Individual Account'}
                </AccountLabel>
              )}
            </Box>
          </Stack>
        </Box>

        <Divider sx={{ mx: 2.25, my: 1.5, opacity: isDark ? 0.2 : 0.4, borderStyle: 'dashed' }} />

        <Box sx={{ px: 2.25, pb: 1.5 }}>
          <Stack spacing={0.5}>
            {menuItems.map((option) => {
              const rootLabel = pathname.includes('/dashboard') ? 'Home' : 'Dashboard';
              const rootHref = pathname.includes('/dashboard') ? '/' : paths.dashboard.root;
              const isActive = pathname === (option.label === 'Home' ? rootHref : option.href);

              return (
                <MenuItemStyled
                  key={option.label}
                  onClick={() => handleClickItem(option.label === 'Home' ? rootHref : option.href)}
                  isActive={isActive}
                  isDark={isDark}
                >
                  <IconContainer isActive={isActive} isDark={isDark}>
                    {option.icon}
                  </IconContainer>

                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: isActive ? 600 : 400,
                      flex: 1,
                    }}
                  >
                    {option.label === 'Home' ? rootLabel : option.label}
                  </Typography>

                  {option.info && (
                    <Label
                      color="error"
                      sx={{
                        ml: 1,
                        fontSize: '0.65rem',
                        height: 18,
                      }}
                    >
                      {option.info}
                    </Label>
                  )}
                </MenuItemStyled>
              );
            })}
          </Stack>
        </Box>

        <Divider sx={{ mx: 2.25, my: 1.5, opacity: isDark ? 0.2 : 0.4, borderStyle: 'dashed' }} />

        <Box sx={{ px: 2.25, pb: 2.25 }}>
          <SignOutButton fullWidth onClose={handleClosePopover} />
        </Box>
      </Popover>
    </>
  );
}
