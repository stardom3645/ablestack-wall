package api

import (
	"fmt"
	"sort"
	"strings"

	"github.com/grafana/grafana/pkg/api/dtos"
	"github.com/grafana/grafana/pkg/bus"
	"github.com/grafana/grafana/pkg/models"
	ac "github.com/grafana/grafana/pkg/services/accesscontrol"
	"github.com/grafana/grafana/pkg/setting"
)

const (
	// Themes
	lightName = "light"
	darkName  = "dark"
)

func (hs *HTTPServer) getProfileNode(c *models.ReqContext) *dtos.NavLink {
	// Only set login if it's different from the name
	var login string
	if c.SignedInUser.Login != c.SignedInUser.NameOrFallback() {
		login = c.SignedInUser.Login
	}
	gravatarURL := dtos.GetGravatarUrl(c.Email)

	children := []*dtos.NavLink{
		{
			Text: "기본 설정", Id: "profile-settings", Url: hs.Cfg.AppSubURL + "/profile", Icon: "sliders-v-alt",
		},
	}

	if setting.AddChangePasswordLink() {
		children = append(children, &dtos.NavLink{
			Text: "비밀번호 변경", Id: "change-password", Url: hs.Cfg.AppSubURL + "/profile/password",
			Icon: "lock", HideFromMenu: true,
		})
	}

	if !setting.DisableSignoutMenu {
		// add sign out first
		children = append(children, &dtos.NavLink{
			Text:         "로그아웃",
			Id:           "sign-out",
			Url:          hs.Cfg.AppSubURL + "/logout",
			Icon:         "arrow-from-right",
			Target:       "_self",
			HideFromTabs: true,
		})
	}

	return &dtos.NavLink{
		Text:         c.SignedInUser.NameOrFallback(),
		SubTitle:     login,
		Id:           "profile",
		Img:          gravatarURL,
		Url:          hs.Cfg.AppSubURL + "/profile",
		HideFromMenu: true,
		SortWeight:   dtos.WeightProfile,
		Children:     children,
	}
}

func (hs *HTTPServer) getAppLinks(c *models.ReqContext) ([]*dtos.NavLink, error) {
	enabledPlugins, err := hs.PluginManager.GetEnabledPlugins(c.OrgId)
	if err != nil {
		return nil, err
	}

	appLinks := []*dtos.NavLink{}
	for _, plugin := range enabledPlugins.Apps {
		if !plugin.Pinned {
			continue
		}

		appLink := &dtos.NavLink{
			Text:       plugin.Name,
			Id:         "plugin-page-" + plugin.Id,
			Url:        plugin.DefaultNavUrl,
			Img:        plugin.Info.Logos.Small,
			SortWeight: dtos.WeightPlugin,
		}

		for _, include := range plugin.Includes {
			if !c.HasUserRole(include.Role) {
				continue
			}

			if include.Type == "page" && include.AddToNav {
				var link *dtos.NavLink
				if len(include.Path) > 0 {
					link = &dtos.NavLink{
						Url:  hs.Cfg.AppSubURL + include.Path,
						Text: include.Name,
					}
					if include.DefaultNav {
						appLink.Url = link.Url // Overwrite the hardcoded page logic
					}
				} else {
					link = &dtos.NavLink{
						Url:  hs.Cfg.AppSubURL + "/plugins/" + plugin.Id + "/page/" + include.Slug,
						Text: include.Name,
					}
				}
				link.Icon = include.Icon
				appLink.Children = append(appLink.Children, link)
			}

			if include.Type == "dashboard" && include.AddToNav {
				link := &dtos.NavLink{
					Url:  hs.Cfg.AppSubURL + include.GetSlugOrUIDLink(),
					Text: include.Name,
				}
				appLink.Children = append(appLink.Children, link)
			}
		}

		if len(appLink.Children) > 0 {
			appLinks = append(appLinks, appLink)
		}
	}

	return appLinks, nil
}

func (hs *HTTPServer) getNavTree(c *models.ReqContext, hasEditPerm bool) ([]*dtos.NavLink, error) {
	hasAccess := ac.HasAccess(hs.AccessControl, c)
	navTree := []*dtos.NavLink{}

	if hasEditPerm {
		children := []*dtos.NavLink{
			{Text: "대시보드", Icon: "apps", Url: hs.Cfg.AppSubURL + "/dashboard/new"},
		}
		if c.OrgRole == models.ROLE_ADMIN || c.OrgRole == models.ROLE_EDITOR {
			children = append(children, &dtos.NavLink{
				Text: "폴더", SubTitle: "대시보드를 구성할 새 폴더 만들기", Id: "folder",
				Icon: "folder-plus", Url: hs.Cfg.AppSubURL + "/dashboards/folder/new",
			})
		}
		children = append(children, &dtos.NavLink{
			Text: "임포트", SubTitle: "대시보드 가져오기", Id: "import", Icon: "import",
			Url: hs.Cfg.AppSubURL + "/dashboard/import",
		})
		navTree = append(navTree, &dtos.NavLink{
			Text:       "생성",
			Id:         "create",
			Icon:       "plus",
			Url:        hs.Cfg.AppSubURL + "/dashboard/new",
			Children:   children,
			SortWeight: dtos.WeightCreate,
		})
	}

	dashboardChildNavs := []*dtos.NavLink{
		{Text: "홈", Id: "home", Url: hs.Cfg.AppSubURL + "/", Icon: "home-alt", HideFromTabs: true},
		{Text: "Divider", Divider: true, Id: "divider", HideFromTabs: true},
		{Text: "관리", Id: "manage-dashboards", Url: hs.Cfg.AppSubURL + "/dashboards", Icon: "sitemap"},
		{Text: "플레이리스트", Id: "playlists", Url: hs.Cfg.AppSubURL + "/playlists", Icon: "presentation-play"},
	}

	if c.IsSignedIn {
		dashboardChildNavs = append(dashboardChildNavs, &dtos.NavLink{
			Text: "스냅샷",
			Id:   "snapshots",
			Url:  hs.Cfg.AppSubURL + "/dashboard/snapshots",
			Icon: "camera",
		})

		dashboardChildNavs = append(dashboardChildNavs, &dtos.NavLink{
			Text: "라이브러리 패널",
			Id:   "library-panels",
			Url:  hs.Cfg.AppSubURL + "/library-panels",
			Icon: "library-panel",
		})
	}

	navTree = append(navTree, &dtos.NavLink{
		Text:       "대시보드",
		Id:         "dashboards",
		SubTitle:   "대시보드와 폴더를 관리합니다.",
		Icon:       "apps",
		Url:        hs.Cfg.AppSubURL + "/",
		SortWeight: dtos.WeightDashboard,
		Children:   dashboardChildNavs,
	})

	canExplore := func(context *models.ReqContext) bool {
		return c.OrgRole == models.ROLE_ADMIN || c.OrgRole == models.ROLE_EDITOR || setting.ViewersCanEdit
	}

	if setting.ExploreEnabled && hasAccess(canExplore, ac.EvalPermission(ac.ActionDatasourcesExplore)) {
		navTree = append(navTree, &dtos.NavLink{
			Text:       "탐색",
			Id:         "explore",
			SubTitle:   "데이터를 탐색하다.",
			Icon:       "compass",
			SortWeight: dtos.WeightExplore,
			Url:        hs.Cfg.AppSubURL + "/explore",
		})
	}

	if c.IsSignedIn {
		navTree = append(navTree, hs.getProfileNode(c))
	}

	if setting.AlertingEnabled {
		alertChildNavs := []*dtos.NavLink{
			{Text: "경고 규칙", Id: "alert-list", Url: hs.Cfg.AppSubURL + "/alerting/list", Icon: "list-ul"},
		}
		if hs.Cfg.IsNgAlertEnabled() {
			alertChildNavs = append(alertChildNavs, &dtos.NavLink{Text: "Alert groups", Id: "groups", Url: hs.Cfg.AppSubURL + "/alerting/groups", Icon: "layer-group"})
			alertChildNavs = append(alertChildNavs, &dtos.NavLink{Text: "Silences", Id: "silences", Url: hs.Cfg.AppSubURL + "/alerting/silences", Icon: "bell-slash"})
		}
		if c.OrgRole == models.ROLE_ADMIN || c.OrgRole == models.ROLE_EDITOR {
			if hs.Cfg.IsNgAlertEnabled() {
				alertChildNavs = append(alertChildNavs, &dtos.NavLink{
					Text: "Contact points", Id: "receivers", Url: hs.Cfg.AppSubURL + "/alerting/notifications",
					Icon: "comment-alt-share",
				})
				alertChildNavs = append(alertChildNavs, &dtos.NavLink{Text: "Notification policies", Id: "am-routes", Url: hs.Cfg.AppSubURL + "/alerting/routes", Icon: "sitemap"})
			} else {
				alertChildNavs = append(alertChildNavs, &dtos.NavLink{
					Text: "알림 채널", Id: "channels", Url: hs.Cfg.AppSubURL + "/alerting/notifications",
					Icon: "comment-alt-share",
				})
			}
		}
		if c.OrgRole == models.ROLE_ADMIN && hs.Cfg.IsNgAlertEnabled() {
			alertChildNavs = append(alertChildNavs, &dtos.NavLink{
				Text: "관리자", Id: "alerting-admin", Url: hs.Cfg.AppSubURL + "/alerting/admin",
				Icon: "cog",
			})
		}

		navTree = append(navTree, &dtos.NavLink{
			Text:       "경고",
			SubTitle:   "경고 규칙 및 알림",
			Id:         "alerting",
			Icon:       "bell",
			Url:        hs.Cfg.AppSubURL + "/alerting/list",
			Children:   alertChildNavs,
			SortWeight: dtos.WeightAlerting,
		})
	}

	appLinks, err := hs.getAppLinks(c)
	if err != nil {
		return nil, err
	}
	navTree = append(navTree, appLinks...)

	configNodes := []*dtos.NavLink{}

	if c.OrgRole == models.ROLE_ADMIN {
		configNodes = append(configNodes, &dtos.NavLink{
			Text:        "데이터 소스",
			Icon:        "database",
			Description: "데이터 소스 추가 및 구성",
			Id:          "datasources",
			Url:         hs.Cfg.AppSubURL + "/datasources",
		})
	}

	if hasAccess(ac.ReqOrgAdmin, ac.EvalPermission(ac.ActionOrgUsersRead, ac.ScopeUsersAll)) {
		configNodes = append(configNodes, &dtos.NavLink{
			Text:        "사용자",
			Id:          "users",
			Description: "조직 구성원 관리",
			Icon:        "user",
			Url:         hs.Cfg.AppSubURL + "/org/users",
		})
	}

	if c.OrgRole == models.ROLE_ADMIN || (hs.Cfg.EditorsCanAdmin && c.OrgRole == models.ROLE_EDITOR) {
		configNodes = append(configNodes, &dtos.NavLink{
			Text:        "팀",
			Id:          "teams",
			Description: "조직 그룹 관리",
			Icon:        "users-alt",
			Url:         hs.Cfg.AppSubURL + "/org/teams",
		})
	}

	if c.OrgRole == models.ROLE_ADMIN {
		configNodes = append(configNodes, &dtos.NavLink{
			Text:        "플러그인",
			Id:          "plugins",
			Description: "조직 기본 설정",
			Icon:        "plug",
			Url:         hs.Cfg.AppSubURL + "/plugins",
		})

		configNodes = append(configNodes, &dtos.NavLink{
			Text:        "기본 설정",
			Id:          "org-settings",
			Description: "조직 기본 설정",
			Icon:        "sliders-v-alt",
			Url:         hs.Cfg.AppSubURL + "/org",
		})
		configNodes = append(configNodes, &dtos.NavLink{
			Text:        "API 키",
			Id:          "apikeys",
			Description: "API 키 생성 및 관리",
			Icon:        "key-skeleton-alt",
			Url:         hs.Cfg.AppSubURL + "/org/apikeys",
		})
	}

	if len(configNodes) > 0 {
		navTree = append(navTree, &dtos.NavLink{
			Id:         dtos.NavIDCfg,
			Text:       "환경 설정",
			SubTitle:   "조직 : " + c.OrgName,
			Icon:       "cog",
			Url:        configNodes[0].Url,
			SortWeight: dtos.WeightConfig,
			Children:   configNodes,
		})
	}

	adminNavLinks := hs.buildAdminNavLinks(c)

	if len(adminNavLinks) > 0 {
		navTree = append(navTree, &dtos.NavLink{
			Text:         "서버 관리자",
			SubTitle:     "모든 사용자 및 조직 관리",
			HideFromTabs: true,
			Id:           "admin",
			Icon:         "shield",
			Url:          adminNavLinks[0].Url,
			SortWeight:   dtos.WeightAdmin,
			Children:     adminNavLinks,
		})
	}

	helpVersion := fmt.Sprintf(`%s v%s (%s)`, setting.ApplicationName, setting.BuildVersion, setting.BuildCommit)
	if hs.Cfg.AnonymousHideVersion && !c.IsSignedIn {
		helpVersion = setting.ApplicationName
	}

	navTree = append(navTree, &dtos.NavLink{
		Text:         "도움",
		SubTitle:     helpVersion,
		Id:           "help",
		Url:          "#",
		Icon:         "question-circle",
		HideFromMenu: true,
		SortWeight:   dtos.WeightHelp,
		Children:     []*dtos.NavLink{},
	})

	return navTree, nil
}

func (hs *HTTPServer) buildAdminNavLinks(c *models.ReqContext) []*dtos.NavLink {
	hasAccess := ac.HasAccess(hs.AccessControl, c)
	adminNavLinks := []*dtos.NavLink{}

	if hasAccess(ac.ReqGrafanaAdmin, ac.EvalPermission(ac.ActionUsersRead, ac.ScopeGlobalUsersAll)) {
		adminNavLinks = append(adminNavLinks, &dtos.NavLink{
			Text: "사용자", Id: "global-users", Url: hs.Cfg.AppSubURL + "/admin/users", Icon: "user",
		})
	}

	if c.IsGrafanaAdmin {
		adminNavLinks = append(adminNavLinks, &dtos.NavLink{
			Text: "조직", Id: "global-orgs", Url: hs.Cfg.AppSubURL + "/admin/orgs", Icon: "building",
		})
	}

	if hasAccess(ac.ReqGrafanaAdmin, ac.EvalPermission(ac.ActionSettingsRead)) {
		adminNavLinks = append(adminNavLinks, &dtos.NavLink{
			Text: "설정", Id: "server-settings", Url: hs.Cfg.AppSubURL + "/admin/settings", Icon: "sliders-v-alt",
		})
	}

	if hs.Cfg.LDAPEnabled && hasAccess(ac.ReqGrafanaAdmin, ac.EvalPermission(ac.ActionLDAPStatusRead)) {
		adminNavLinks = append(adminNavLinks, &dtos.NavLink{
			Text: "LDAP", Id: "ldap", Url: hs.Cfg.AppSubURL + "/admin/ldap", Icon: "book",
		})
	}

	if hs.Cfg.PluginAdminEnabled && hasAccess(ac.ReqGrafanaAdmin, ac.EvalPermission(ac.ActionPluginsManage)) {
		adminNavLinks = append(adminNavLinks, &dtos.NavLink{
			Text: "플러그인", Id: "admin-plugins", Url: hs.Cfg.AppSubURL + "/admin/plugins", Icon: "plug",
		})
	}

	return adminNavLinks
}

func (hs *HTTPServer) setIndexViewData(c *models.ReqContext) (*dtos.IndexViewData, error) {
	hasEditPermissionInFoldersQuery := models.HasEditPermissionInFoldersQuery{SignedInUser: c.SignedInUser}
	if err := bus.Dispatch(&hasEditPermissionInFoldersQuery); err != nil {
		return nil, err
	}
	hasEditPerm := hasEditPermissionInFoldersQuery.Result

	settings, err := hs.getFrontendSettingsMap(c)
	if err != nil {
		return nil, err
	}

	settings["dateFormats"] = hs.Cfg.DateFormats

	prefsQuery := models.GetPreferencesWithDefaultsQuery{User: c.SignedInUser}
	if err := bus.DispatchCtx(c.Req.Context(), &prefsQuery); err != nil {
		return nil, err
	}
	prefs := prefsQuery.Result

	// Read locale from accept-language
	acceptLang := c.Req.Header.Get("Accept-Language")
	locale := "en-US"

	if len(acceptLang) > 0 {
		parts := strings.Split(acceptLang, ",")
		locale = parts[0]
	}

	appURL := setting.AppUrl
	appSubURL := hs.Cfg.AppSubURL

	// special case when doing localhost call from image renderer
	if c.IsRenderCall && !hs.Cfg.ServeFromSubPath {
		appURL = fmt.Sprintf("%s://localhost:%s", hs.Cfg.Protocol, hs.Cfg.HTTPPort)
		appSubURL = ""
		settings["appSubUrl"] = ""
	}

	navTree, err := hs.getNavTree(c, hasEditPerm)
	if err != nil {
		return nil, err
	}

	data := dtos.IndexViewData{
		User: &dtos.CurrentUser{
			Id:                         c.UserId,
			IsSignedIn:                 c.IsSignedIn,
			Login:                      c.Login,
			Email:                      c.Email,
			Name:                       c.Name,
			OrgCount:                   c.OrgCount,
			OrgId:                      c.OrgId,
			OrgName:                    c.OrgName,
			OrgRole:                    c.OrgRole,
			GravatarUrl:                dtos.GetGravatarUrl(c.Email),
			IsGrafanaAdmin:             c.IsGrafanaAdmin,
			LightTheme:                 prefs.Theme == lightName,
			Timezone:                   prefs.Timezone,
			Locale:                     locale,
			HelpFlags1:                 c.HelpFlags1,
			HasEditPermissionInFolders: hasEditPerm,
		},
		Settings:                settings,
		Theme:                   prefs.Theme,
		AppUrl:                  appURL,
		AppSubUrl:               appSubURL,
		GoogleAnalyticsId:       setting.GoogleAnalyticsId,
		GoogleTagManagerId:      setting.GoogleTagManagerId,
		BuildVersion:            setting.BuildVersion,
		BuildCommit:             setting.BuildCommit,
		NewGrafanaVersion:       hs.PluginManager.GrafanaLatestVersion(),
		NewGrafanaVersionExists: hs.PluginManager.GrafanaHasUpdate(),
		AppName:                 setting.ApplicationName,
		AppNameBodyClass:        getAppNameBodyClass(hs.License.HasValidLicense()),
		FavIcon:                 "public/img/fav32.png",
		AppleTouchIcon:          "public/img/apple-touch-icon.png",
		AppTitle:                "ABLESTACK",
		NavTree:                 navTree,
		Sentry:                  &hs.Cfg.Sentry,
		Nonce:                   c.RequestNonce,
		ContentDeliveryURL:      hs.Cfg.GetContentDeliveryURL(hs.License.ContentDeliveryPrefix()),
		LoadingLogo:             "public/img/grafana_icon.svg",
	}

	if hs.Cfg.FeatureToggles["accesscontrol"] {
		userPermissions, err := hs.AccessControl.GetUserPermissions(c.Req.Context(), c.SignedInUser)
		if err != nil {
			return nil, err
		}

		data.User.Permissions = ac.BuildPermissionsMap(userPermissions)
	}

	if setting.DisableGravatar {
		data.User.GravatarUrl = hs.Cfg.AppSubURL + "/public/img/user_profile.png"
	}

	if len(data.User.Name) == 0 {
		data.User.Name = data.User.Login
	}

	themeURLParam := c.Query("theme")
	if themeURLParam == lightName {
		data.User.LightTheme = true
		data.Theme = lightName
	} else if themeURLParam == darkName {
		data.User.LightTheme = false
		data.Theme = darkName
	}

	hs.HooksService.RunIndexDataHooks(&data, c)

	sort.SliceStable(data.NavTree, func(i, j int) bool {
		return data.NavTree[i].SortWeight < data.NavTree[j].SortWeight
	})

	return &data, nil
}

func (hs *HTTPServer) Index(c *models.ReqContext) {
	data, err := hs.setIndexViewData(c)
	if err != nil {
		c.Handle(hs.Cfg, 500, "Failed to get settings", err)
		return
	}
	c.HTML(200, "index", data)
}

func (hs *HTTPServer) NotFoundHandler(c *models.ReqContext) {
	if c.IsApiRequest() {
		c.JsonApiErr(404, "Not found", nil)
		return
	}

	data, err := hs.setIndexViewData(c)
	if err != nil {
		c.Handle(hs.Cfg, 500, "Failed to get settings", err)
		return
	}

	c.HTML(404, "index", data)
}

func getAppNameBodyClass(validLicense bool) string {
	if validLicense {
		return "app-enterprise"
	}

	return "app-grafana"
}
