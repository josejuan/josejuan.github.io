---
layout: post
title: ZTE F680 router root access
author: josejuan
categories: hardware
---

A tu _router_ podrás entrar por telnet con algo como

```text
[josejuan@centella ~]$ telnet 192.168.0.1
Trying 192.168.0.1...
Connected to router.
Escape character is '^]'.
F680
Login: root
Password:

BusyBox v1.01 (2017.01.10-07:21+0000) Built-in shell (ash)
Enter 'help' for a list of built-in commands.

/ #
```

Donde la IP será la de por defecto u otra si la cambias y el password en mi caso `Zte521`.

Aunque no podrás hacer nada desde ese terminal (cuatro comandos chorras) puedes ver por ejemplo donde montan la unidad extraible por _USB_ usando el **tabulador** (no puedes usar el comando `ls`) por ejemplo:

```text
BusyBox v1.01 (2017.01.10-07:21+0000) Built-in shell (ash)
Enter 'help' for a list of built-in commands.

/ # /mnt/usb1_1/
```

En mi caso aparece que se montará en la ruta `/mnt/usb1_1`.

Podemos hacer lo mismo para confirmar/buscar la ruta del fichero de configuración del servidor _samba_.

Por ejemplo (recuerda, usamos el **tabulador** para poder ver directorios que no podemos listar ni ver):

```text
/ # /var/samba/
/var/samba/lib/  /var/samba/var/
/ # /var/samba/lib/
/var/samba/lib/hosts     /var/samba/lib/lmhosts   /var/samba/lib/smb.conf
/ # /var/samba/lib/smb.conf
```

Ya está, ya sabemos todo lo necesario para tener acceso de _root_.

En una memoria _USB_ crea un enlace simbólico al fichero `smb.conf`, por ejemplo `ln -s /var/samba/lib/smb.conf .` (desde _linux_ supongo).

Mete dicha memoria en el puerto _USB_ del _router_ y verifica que tienes habilitado el servidor _samba_.

Inicia una sesión _samba_ contra tu _router_ (con _Windows_, en _Linux_ parece que no va) y verás que podrás modificar el fichero `smb.conf` porque el enlace simbólico apunta al fichero real.

Edítalo como desees, pero dos líneas son necesarias en el grupo `[global]`:

```text
guest account = root
preexec = /bin/sh -c '(sendcmd 1 DB set TelnetCfg 0 UserTypeFlag 0 && sendcmd 1 DB save) 2> /mnt/usb1_1/cmd.err > /mnt/usb1_1/cmd.out'
```

Con la primera hacemos que el usuario que inicia sesión sea `root` y con la segunda modificamos la configuración del servicio de `telnet` para que no estén capados los comandos, si hubiera algún problema veremos los errores en `cmd.err` y si todo va bien, veremos la configuración activa en `cmd.out`.

Una vez hayas guardado los cambios **sin resetear nada**, incia una nueva sesión _telnet_ (realmente con que navegues desde la raíz ya se ejecuta el comando).

**¡voila!** ya tienes acceso de _root_ permanente (un reset del router te mantendrá los permisos de root).

Para cambiar el _password_, se trata trastear con el comando `sendcmd` que permite realizar todos los ajustes del _router_, por ejemplo para ver la configuración del servicio `telnet`:

```text
/ # sendcmd 1 DB p TelnetCfg
<Tbl name="TelnetCfg" RowCount="1">
        <Row No="0">
                <DM name="TS_Enable" val="1" AccessAttr="0"/>
                <DM name="Wan_Enable" val="0" AccessAttr="0"/>
                <DM name="Lan_Enable" val="0" AccessAttr="0"/>
                <DM name="TS_Port" val="23" AccessAttr="0"/>
                <DM name="TS_UName" val="root" AccessAttr="0"/>
                <DM name="TS_UPwd" val="************" AccessAttr="0"/>
                <DM name="Max_Con_Num" val="5" AccessAttr="0"/>
                <DM name="ProcType" val="0" AccessAttr="0"/>
                <DM name="UserTypeFlag" val="0" AccessAttr="0"/>
        </Row>
</Tbl>
```

Y para setearlo:

```text
/ # sendcmd 1 DB set TelnetCfg 0 TS_UPwd aquiElPassQueQuiera
/ # sendcmd 1 DB save
```

Y ya está.

### Referencias

* [Inf-O](https://blog.eth1.es/2017/02/18/desbloqueando-el-router-zte-f680/)

