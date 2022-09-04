---
layout: '../../layouts/BlogPost.astro'
title: ODBC Driver and OLEDB Provider Issues and Potential Fixes
description: Issues with ODBC and OLEDB are quite annoying, typically found when trying to use these drivers to connect to an excel sheet. Here I detail how I solved my issues using IIS.
author: Caleb Ukle
publish_date: 2019-01-10
img: https://cdn.doubleuideas.com/blog/odbc-driver/app-pool-adv-settings.png?auto=format
tags:
  - ODBC
  - OLEDB
  - Excel
  - Microsoft
  - Blog
---

> _This post originally appeared on
> [Medium on January 10, 2019](https://medium.com/@caleb.ukle/odbc-driver-and-oledb-provider-issues-and-potential-fixes-1b165de20e1b)._

## The Problem

You are needing to read an excel sheet because you…

- Need to import it into SQL

- Interface with an excel file as a relational database

- Something else about accessing stuff from excel through code.

… and you’re getting errors similar to…

- The ‘Microsoft.Jet.OLEDB.4.0’ provider is not registered on the local machine

- The ‘Microsoft.ACE.OLDEB.12.0’ provider is not registered on the local machine

- Exception from HRESULT: 0x800A03EC

then this article should provide to be quite useful.

The crux of the problem for most people is selecting the wrong driver version,
32-bit vs 64-bit, for your system. If that doesn’t click for you right now, then
the rest of the article will go over in more detail which drivers you need
specifically, what those drivers do, a little configuration and why “it works on
my machine, but not on the server.”

## Preface

> _Microsoft does not currently recommend, and does not support, Automation of
> Microsoft Office applications from any unattended, non-interactive client
> application or component (including ASP, ASP.NET, DCOM, and NT Services),
> because Office may exhibit unstable behavior and/or deadlock when Office is
> run in this environment_.

[See notice here.](https://support.microsoft.com/en-us/help/257757/considerations-for-server-side-automation-of-office?wa=wsignin1.0%3Fwa%3Dwsignin1.0)

So let that sit there for a minute… and that’s why this is such a pain and why
you should be using the newer
[OpenXML](https://docs.microsoft.com/en-us/office/open-xml/open-xml-sdk)standard
to access your excel sheets. Save your self some headache and use a library that
allows modifying Excel files instead of using the Office Interop Assemblies.
Using the interop may start working on your local machine, but it will break at
some point for some reason once deployed, guaranteed. Also, the Office Interop
Assemblies require having Office installed on your server, since the interop
only provides a programmatic interface to the actual program Office application.
Installing Office on your server is going to take up space just to be able to
access an excel sheet. Lots of bloat if you ask me.

Some wrapper libraries to help you with
[OpenXML](https://docs.microsoft.com/en-us/office/open-xml/open-xml-sdk):

- .NET —[ClosedXML (github)](https://github.com/ClosedXML/ClosedXML)

- node.js — [exceljs (github)](https://github.com/guyonroche/exceljs)

- PHP — [PhpSpreadsheet(github)](https://github.com/PHPOffice/PhpSpreadsheet)

_**Disclosure:** I only have slight experience with ClosedXML, .NET, The other
libraries I have seen recommended around Stack Overflow so I placed them here
for reference._

## Set-up

The ODBC driver, Open DataBase Connectivity, allows for connection to relational
database. As far as I’m aware this is required as apart of getting access to
excel sheets. My understanding is the OLEDB Provider extends the ODBC
capabilities to work with non relational databases such as excel workbooks;
therefore the ODBC is needed as well. If you have installed MSSQL, MySql or
another database you might already have it installed. If you go to _Control
Panel > System and Security > Administrative Tools_, you will see *ODBC Data
Source (32-bit) and/or ODBC Data Source (64-bit). *If you don’t have those ODBC
applications then go ahead and install the ODBC driver for you system, download
links below.

The most important part is to make sure you **use the same 32/64 bit as each
other, along with your process calling the driver/provider**. For Example, if
you use 32-bit ODBC, then you must install 32-bit OLEDB Provider and your
process, such as your IIS AppPool, must be running as 32-bit. Vice versa for
64-bit.

I already had the MSSQL ODBC Driver installed already, so I only needed the
OLEDB provider. I used the 2007 version, there are version for 2010 and 2016 I
believe. If one version doesn’t work, try the other ones. But only one can be
installed at time. Trying to install a different version, just prompts for a
repair/reinstall the existing one. Just make sure you maintain the smae bit
version, I ended up using 32-bit.

## Configure

![Directly from the OLEDB download instructions](https://cdn.doubleuideas.com/blog/odbc-driver/oledb-instructions.png?auto=format)

The steps in the image above come directly from the install guide for the OLEDB
provider, Office System Driver: Data Connectivity Components. You can add these
Data Sources in _Control Panel > System and Security > Administrative Tools >
ODBC Data Source (32/64-bit)._

![ODBC Data Source Admin Panel](https://cdn.doubleuideas.com/blog/odbc-driver/admin-panel.png?auto=format)

I do not believe it’s required, but I always restarted when I changed the ODBC
Data Sources.

## Finally

Hopefully at this point, you’re application is working great with excel because
you’re using OpenXML, and are loving your life. If not there are some
troubleshooting options for you.

1. Try a reboot (IT troubleshoot technique #1)

1. Make sure your ODBC driver, OLDB Provider, and application process are
   running the same bit version (32 vs 64 bit)

1. Make sure if using the interop, you shouldn’t be, then the excel.exe process
   could not be closing/locked by another user.

1. Apparently, Excel indexes at 1 instead of 0 as noted by
   [this Stack Overflow response.](https://stackoverflow.com/questions/12714626/exception-from-hresult-0x800a03ec-error)

1. Try repairing or uninstalling then reinstalling the ODBC driver and OLEDB
   provider.

## Changing IIS to 32 bit Process

In order to get excel reading when you’ve already verified the ODBC and OLEDB
are the right version, you’ll need to change your process to 32 bit, assuming
your driver is 32 bit. I am working with a .Net Framework web application so
that’s the example below. Check for you application to make sure it’s running
the right version.

1. Open IIS

1. Go to AppPools

1. Right click desired AppPool > Advanced Settings

1. Change “Enable 32-bit Application” to True

![AppPool Advanced Settings](https://cdn.doubleuideas.com/blog/odbc-driver/app-pool-adv-settings.png?auto=format)

## Downloads

- [MySql ODBC Driver](https://dev.mysql.com/downloads/connector/odbc/)

- [SqlServer ODBC Drivers](https://docs.microsoft.com/en-us/sql/connect/odbc/download-odbc-driver-for-sql-server?view=sql-server-2017)

- [2007 OLEDB System Provider](https://www.microsoft.com/en-us/download/details.aspx?id=23734)

- [2010 OLEDB System Provider](https://www.microsoft.com/en-us/download/details.aspx?id=13255)

- [2016 OLEDB System Provider](https://www.microsoft.com/en-us/download/details.aspx?id=54920)

[Here are the connection strings for excel as well from the wonderful connectionstrings.com.](https://www.connectionstrings.com/excel/)

_Post Edits_

- _2019-08-20_ Moved to personal site
