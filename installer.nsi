# This installs two files, app.exe and logo.ico, creates a start menu shortcut, builds an uninstaller, and
# adds uninstall information to the registry for Add/Remove Programs

# To get started, put this script into a folder with the two files (app.exe, logo.ico, and license.rtf -
# You'll have to create these yourself) and run makensis on it

# If you change the names "app.exe", "logo.ico", or "license.rtf" you should do a search and replace - they
# show up in a few places.
# All the other settings can be tweaked by editing the !defines at the top of this script
!define APPNAME "NavPay"
!define COMPANYNAME "NavCoin"
!define DESCRIPTION "Windows installer for the NavPay multiwallet"
# These three must be integers
!define VERSIONMAJOR 1
!define VERSIONMINOR 0
!define VERSIONBUILD 2
# These will be displayed by the "Click here for support information" link in "Add/Remove Programs"
# It is possible to use "mailto:" links in here to open the email client
!define HELPURL "http://www.navcoin.org" # "Support Information" link
!define UPDATEURL "http://www.navcoin.org" # "Product Updates" link
!define ABOUTURL "http://www.navcoin.org" # "Publisher" link
# This is the size (in kB) of all the files copied into "Program Files"
!define INSTALLSIZE 7233

RequestExecutionLevel admin ;Require admin rights on NT6+ (When UAC is turned on)

InstallDir "$PROGRAMFILES\${COMPANYNAME}\${APPNAME}"

# rtf or txt file - remember if it is txt, it must be in the DOS text format (\r\n)
# LicenseData "license.rtf"
# This will be in the installer/uninstaller's title bar
Name "${COMPANYNAME} - ${APPNAME}"
# Icon "logo.ico"
outFile "sample-installer.exe"

!include LogicLib.nsh

# Just three pages - license agreement, install location, and installation
# page license
page directory
Page instfiles

!macro VerifyUserIsAdmin
UserInfo::GetAccountType
pop $0
${If} $0 != "admin" ;Require admin rights on NT4+
        messageBox mb_iconstop "Administrator rights required!"
        setErrorLevel 740 ;ERROR_ELEVATION_REQUIRED
        quit
${EndIf}
!macroend

function .onInit
	setShellVarContext all
	!insertmacro VerifyUserIsAdmin
functionEnd

section "install"
	# Files for the install directory - to build the installer, these should be in the same directory as the install script (this file)
	setOutPath $INSTDIR
	# Files added here should be removed by the uninstaller (see section "uninstall")
	# file "logo.ico"

file /r *
# file pncal\*
  # file "NavPay.exe"
  # file "d3dcompiler_47.dll"
  # file "libEGL.dll"
  # file "nacl_irt_x86_64.nexe"
  # file "nw.dll"
  # file "nw_elf.dll"
  # file /r "pnacl\*"
  # file /r "locales\*.*"
  # file "chromedriver.exe"
  # file "ffmpeg.dll"
  # file "libGLESv2.dll"
  # file "natives_blob.bin"
  # file "nw_100_percent.pak"
  # file "nwjc.exe"
  # file "resources.pak"
  # file "credits.html"
  # file "icudtl.dat"
  # file "locales"
  # file "node.dll"
  # file "nw_200_percent.pak"
  # file "payload.exe"
  # file "snapshot_blob.bin"
	# Add any other files for the install directory (license files, app data, etc) here

	# Uninstaller - See function un.onInit and section "uninstall" for configuration
	writeUninstaller "$INSTDIR\uninstall.exe"

	# Start Menu
	createDirectory "$SMPROGRAMS\${COMPANYNAME}"
	createShortCut "$SMPROGRAMS\${COMPANYNAME}\${APPNAME}.lnk" "$INSTDIR\app.exe" "" "$INSTDIR\logo.ico"

	# Registry information for add\remove programs
	WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${COMPANYNAME} ${APPNAME}" "DisplayName" "${COMPANYNAME} - ${APPNAME} - ${DESCRIPTION}"
	WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${COMPANYNAME} ${APPNAME}" "UninstallString" "$\"$INSTDIR\uninstall.exe$\""
	WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${COMPANYNAME} ${APPNAME}" "QuietUninstallString" "$\"$INSTDIR\uninstall.exe$\" \S"
	WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${COMPANYNAME} ${APPNAME}" "InstallLocation" "$\"$INSTDIR$\""
	WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${COMPANYNAME} ${APPNAME}" "DisplayIcon" "$\"$INSTDIR\logo.ico$\""
	WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${COMPANYNAME} ${APPNAME}" "Publisher" "$\"${COMPANYNAME}$\""
	WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${COMPANYNAME} ${APPNAME}" "HelpLink" "$\"${HELPURL}$\""
	WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${COMPANYNAME} ${APPNAME}" "URLUpdateInfo" "$\"${UPDATEURL}$\""
	WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${COMPANYNAME} ${APPNAME}" "URLInfoAbout" "$\"${ABOUTURL}$\""
	WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${COMPANYNAME} ${APPNAME}" "DisplayVersion" "$\"${VERSIONMAJOR}.${VERSIONMINOR}.${VERSIONBUILD}$\""
	WriteRegDWORD HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${COMPANYNAME} ${APPNAME}" "VersionMajor" ${VERSIONMAJOR}
	WriteRegDWORD HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${COMPANYNAME} ${APPNAME}" "VersionMinor" ${VERSIONMINOR}
	# There is no option for modifying or repairing the install
	WriteRegDWORD HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${COMPANYNAME} ${APPNAME}" "NoModify" 1
	WriteRegDWORD HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${COMPANYNAME} ${APPNAME}" "NoRepair" 1
	# Set the INSTALLSIZE constant (!defined at the top of this script) so Add\Remove Programs can accurately report the size
	WriteRegDWORD HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${COMPANYNAME} ${APPNAME}" "EstimatedSize" ${INSTALLSIZE}
sectionEnd

# Uninstaller

function un.onInit
	SetShellVarContext all

	#Verify the uninstaller - last chance to back out
	MessageBox MB_OKCANCEL "Permanantly remove ${APPNAME}?" IDOK next
		Abort
	next:
	!insertmacro VerifyUserIsAdmin
functionEnd

section "uninstall"

	# Remove Start Menu launcher
	delete "$SMPROGRAMS\${COMPANYNAME}\${APPNAME}.lnk"
	# Try to remove the Start Menu folder - this will only happen if it is empty
	rmDir "$SMPROGRAMS\${COMPANYNAME}"

	# Remove files
  delete $INSTDIR\NavPay.exe
  delete $INSTDIR\d3dcompiler_47.dll
  delete $INSTDIR\libEGL.dll
  delete $INSTDIR\nacl_irt_x86_64.nexe
  delete $INSTDIR\nw.dll
  delete $INSTDIR\nw_elf.dll
  delete $INSTDIR\chromedriver.exe
  delete $INSTDIR\ffmpeg.dll
  delete $INSTDIR\libGLESv2.dll
  delete $INSTDIR\natives_blob.bin
  delete $INSTDIR\nw_100_percent.pak
  delete $INSTDIR\nwjc.exe
  delete $INSTDIR\resources.pak
  delete $INSTDIR\credits.html
  delete $INSTDIR\icudtl.dat
  delete $INSTDIR\locales
  delete $INSTDIR\node.dll
  delete $INSTDIR\nw_200_percent.pak
  delete $INSTDIR\payload.exe
  delete $INSTDIR\snapshot_blob.bin
  delete $INSTDIR\pnacl\pnacl_public_pnacl_json
  delete $INSTDIR\pnacl\pnacl_public_x86_32_libcrt_platform_a
  delete $INSTDIR\pnacl\pnacl_public_x86_64_crtbegin_for_eh_o
  delete $INSTDIR\pnacl\pnacl_public_x86_64_libgcc_a
  delete $INSTDIR\pnacl\pnacl_public_x86_32_crtbegin_for_eh_o
  delete $INSTDIR\pnacl\pnacl_public_x86_32_libgcc_a
  delete $INSTDIR\pnacl\pnacl_public_x86_64_crtbegin_o
  delete $INSTDIR\pnacl\pnacl_public_x86_64_libpnacl_irt_shim_a
  delete $INSTDIR\pnacl\pnacl_public_x86_32_crtbegin_o
  delete $INSTDIR\pnacl\pnacl_public_x86_32_libpnacl_irt_shim_dummy_a
  delete $INSTDIR\pnacl\pnacl_public_x86_64_crtend_o
  delete $INSTDIR\pnacl\pnacl_public_x86_64_libpnacl_irt_shim_dummy_a
  delete $INSTDIR\pnacl\pnacl_public_x86_32_crtend_o
  delete $INSTDIR\pnacl\pnacl_public_x86_32_pnacl_llc_nexe
  delete $INSTDIR\pnacl\pnacl_public_x86_64_ld_nexe
  delete $INSTDIR\pnacl\pnacl_public_x86_64_pnacl_llc_nexe
  delete $INSTDIR\pnacl\pnacl_public_x86_32_ld_nexe
  delete $INSTDIR\pnacl\pnacl_public_x86_32_pnacl_sz_nexe
  delete $INSTDIR\pnacl\pnacl_public_x86_64_libcrt_platform_a
  delete $INSTDIR\pnacl\pnacl_public_x86_64_pnacl_sz_nexe
  delete $INSTDIR\locales\am.pak
  delete $INSTDIR\locales\bn.pak
  delete $INSTDIR\locales\da.pak
  delete $INSTDIR\locales\en-GB.pak
  delete $INSTDIR\locales\es.pak
  delete $INSTDIR\locales\fi.pak
  delete $INSTDIR\locales\gu.pak
  delete $INSTDIR\locales\hr.pak
  delete $INSTDIR\locales\it.pak
  delete $INSTDIR\locales\ko.pak
  delete $INSTDIR\locales\ml.pak
  delete $INSTDIR\locales\nb.pak
  delete $INSTDIR\locales\pt-BR.pak
  delete $INSTDIR\locales\ru.pak
  delete $INSTDIR\locales\sr.pak
  delete $INSTDIR\locales\ta.pak
  delete $INSTDIR\locales\tr.pak
  delete $INSTDIR\locales\zh-CN.pak
  delete $INSTDIR\locales\ar.pak
  delete $INSTDIR\locales\ca.pak
  delete $INSTDIR\locales\de.pak
  delete $INSTDIR\locales\en-US.pak
  delete $INSTDIR\locales\et.pak
  delete $INSTDIR\locales\fil.pak
  delete $INSTDIR\locales\he.pak
  delete $INSTDIR\locales\hu.pak
  delete $INSTDIR\locales\ja.pak
  delete $INSTDIR\locales\lt.pak
  delete $INSTDIR\locales\mr.pak
  delete $INSTDIR\locales\nl.pak
  delete $INSTDIR\locales\pt-PT.pak
  delete $INSTDIR\locales\sk.pak
  delete $INSTDIR\locales\sv.pak
  delete $INSTDIR\locales\te.pak
  delete $INSTDIR\locales\uk.pak
  delete $INSTDIR\locales\zh-TW.pak
  delete $INSTDIR\locales\bg.pak
  delete $INSTDIR\locales\cs.pak
  delete $INSTDIR\locales\el.pak
  delete $INSTDIR\locales\es-419.pak
  delete $INSTDIR\locales\fa.pak
  delete $INSTDIR\locales\fr.pak
  delete $INSTDIR\locales\hi.pak
  delete $INSTDIR\locales\id.pak
  delete $INSTDIR\locales\kn.pak
  delete $INSTDIR\locales\lv.pak
  delete $INSTDIR\locales\ms.pak
  delete $INSTDIR\locales\pl.pak
  delete $INSTDIR\locales\ro.pak
  delete $INSTDIR\locales\sl.pak
  delete $INSTDIR\locales\sw.pak
  delete $INSTDIR\locales\th.pak
  delete $INSTDIR\locales\vi.pak


	# Always delete uninstaller as the last action
	delete $INSTDIR\uninstall.exe

	# Try to remove the install directory - this will only happen if it is empty
	rmDir $INSTDIR

	# Remove uninstaller information from the registry
	DeleteRegKey HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${COMPANYNAME} ${APPNAME}"
sectionEnd
