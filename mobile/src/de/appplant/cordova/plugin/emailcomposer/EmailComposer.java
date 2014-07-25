/*
    Copyright 2013-2014 appPlant UG

    Licensed to the Apache Software Foundation (ASF) under one
    or more contributor license agreements.  See the NOTICE file
    distributed with this work for additional information
    regarding copyright ownership.  The ASF licenses this file
    to you under the Apache License, Version 2.0 (the
    "License"); you may not use this file except in compliance
    with the License.  You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

    Unless required by applicable law or agreed to in writing,
    software distributed under the License is distributed on an
    "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
    KIND, either express or implied.  See the License for the
    specific language governing permissions and limitations
    under the License.
*/

package de.appplant.cordova.plugin.emailcomposer;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.ArrayList;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import android.content.Intent;
import android.content.res.AssetManager;
import android.content.res.Resources;
import android.net.Uri;
import android.text.Html;
import android.util.Base64;

import org.apache.cordova.CordovaPlugin;
import org.apache.cordova.CallbackContext;
import org.apache.cordova.PluginResult;

public class EmailComposer extends CordovaPlugin {

    static protected final String STORAGE_FOLDER = File.separator + "email_composer";

    private CallbackContext command;

    @Override
    public boolean execute (String action, JSONArray args, CallbackContext callbackContext) throws JSONException {

        this.command = callbackContext;

        // Eine E-Mail soll versendet werden
        if ("open".equals(action)) {
            open(args);

            return true;
        }

        // Es soll überprüft werden, ob ein Dienst zum Versenden der E-Mail zur Verfügung steht
        if ("isServiceAvailable".equals(action)) {
            isServiceAvailable();

            return true;
        }

        // Returning false results in a "MethodNotFound" error.
        return false;
    }

    /**
     * Überprüft, ob Emails versendet werden können.
     */
    private void isServiceAvailable () {
        Boolean available   = isEmailAccountConfigured();
        PluginResult result = new PluginResult(PluginResult.Status.OK, available);

        command.sendPluginResult(result);
    }

    /**
     * Öffnet den Email-Kontroller mit vorausgefüllten Daten.
     */
    private void open (JSONArray args) throws JSONException {
        JSONObject properties = args.getJSONObject(0);
        Intent draft          = getDraftWithProperties(properties);

        openDraft(draft);
    }

    /**
     * Erstellt den ViewController für Mails und fügt die übergebenen Eigenschaften ein.
     *
     * @param {JSONObject} params (Subject, Body, Recipients, ...)
     */
    private Intent getDraftWithProperties (JSONObject params) throws JSONException {
        Intent mail = new Intent(android.content.Intent.ACTION_SEND_MULTIPLE);

        if (params.has("subject"))
            setSubject(params.getString("subject"), mail);
        if (params.has("body"))
            setBody(params.getString("body"), params.optBoolean("isHtml"), mail);
        if (params.has("to"))
            setRecipients(params.getJSONArray("to"), mail);
        if (params.has("cc"))
            setCcRecipients(params.getJSONArray("cc"), mail);
        if (params.has("bcc"))
            setBccRecipients(params.getJSONArray("bcc"), mail);
        if (params.has("attachments"))
            setAttachments(params.getJSONArray("attachments"), mail);

        mail.setType("application/octet-stream");

        return mail;
    }

    /**
     * Zeigt den ViewController zum Versenden/Bearbeiten der Mail an.
     */
    private void openDraft (final Intent draft) {
        final EmailComposer plugin = this;

        cordova.getThreadPool().execute( new Runnable() {
            public void run() {
                cordova.startActivityForResult(plugin, Intent.createChooser(draft, "Select Email App"), 0);
            }
        });
    }

    /**
     * Setzt den Subject der Mail.
     */
    private void setSubject (String subject, Intent draft) {
        draft.putExtra(android.content.Intent.EXTRA_SUBJECT, subject);
    }

    /**
     * Setzt den Body der Mail.
     */
    private void setBody (String body, Boolean isHTML, Intent draft) {
        if (isHTML) {
            draft.putExtra(android.content.Intent.EXTRA_TEXT, Html.fromHtml(body));
            draft.setType("text/html");
        } else {
            draft.putExtra(android.content.Intent.EXTRA_TEXT, body);
            draft.setType("text/plain");
        }
    }

    /**
     * Setzt die Empfänger der Mail.
     */
    private void setRecipients (JSONArray recipients, Intent draft) throws JSONException {
        String[] receivers = new String[recipients.length()];

        for (int i = 0; i < recipients.length(); i++) {
            receivers[i] = recipients.getString(i);
        }

        draft.putExtra(android.content.Intent.EXTRA_EMAIL, receivers);
    }

    /**
     * Setzt die CC-Empfänger der Mail.
     */
    private void setCcRecipients (JSONArray ccRecipients, Intent draft) throws JSONException {
        String[] receivers = new String[ccRecipients.length()];

        for (int i = 0; i < ccRecipients.length(); i++) {
            receivers[i] = ccRecipients.getString(i);
        }

        draft.putExtra(android.content.Intent.EXTRA_CC, receivers);
    }

    /**
     * Setzt die BCC-Empfänger der Mail.
     */
    private void setBccRecipients (JSONArray bccRecipients, Intent draft) throws JSONException {
        String[] receivers = new String[bccRecipients.length()];

        for (int i = 0; i < bccRecipients.length(); i++) {
            receivers[i] = bccRecipients.getString(i);
        }

        draft.putExtra(android.content.Intent.EXTRA_BCC, receivers);
    }

    /**
     * Fügt die Anhände zur Mail hinzu.
     */
    private void setAttachments (JSONArray attachments, Intent draft) throws JSONException {
        ArrayList<Uri> attachmentUris = new ArrayList<Uri>();

        for (int i = 0; i < attachments.length(); i++) {
            Uri attachmentUri = getUriForPath(attachments.getString(i));

            attachmentUris.add(attachmentUri);
        }

        draft.putParcelableArrayListExtra(Intent.EXTRA_STREAM, attachmentUris);
    }

    /**
     * Gibt an, ob es eine Anwendung gibt, welche E-Mails versenden kann.
     */
    private Boolean isEmailAccountConfigured () {
        Intent  intent    = new Intent(Intent.ACTION_SENDTO, Uri.fromParts("mailto","max@mustermann.com", null));
        Boolean available = cordova.getActivity().getPackageManager().queryIntentActivities(intent, 0).size() > 1;

        return available;
    }

    /**
     * The URI for an attachment path.
     *
     * @param {String} path
     *      The given path to the attachment
     *
     * @return The URI pointing to the given path
     */
    private Uri getUriForPath (String path) {
        if (path.startsWith("res:")) {
            return getUriForResourcePath(path);
        } else if (path.startsWith("file:")) {
            return getUriForAbsolutePath(path);
        } else if (path.startsWith("www:")) {
            return getUriForAssetPath(path);
        } else if (path.startsWith("base64:")) {
            return getUriForBase64Content(path);
        }

        return Uri.parse(path);
    }

    /**
     * The URI for a file.
     *
     * @param {String} path
     *      The given absolute path
     *
     * @return The URI pointing to the given path
     */
    private Uri getUriForAbsolutePath (String path) {
        String absPath = path.replaceFirst("file://", "");
        File file      = new File(absPath);

        if (!file.exists()) {
            System.err.println("Attachment path not found: " + file.getAbsolutePath());
        }

        return Uri.fromFile(file);
    }

    /**
     * The URI for an asset.
     *
     * @param {String} path
     *      The given asset path
     *
     * @return The URI pointing to the given path
     */
    private Uri getUriForAssetPath (String path) {
        String resPath  = path.replaceFirst("www:/", "www");
        String fileName = resPath.substring(resPath.lastIndexOf('/') + 1);
        String storage  = cordova.getActivity().getExternalCacheDir().toString() + STORAGE_FOLDER;

        File file = new File(storage, fileName);

        new File(storage).mkdir();

        try {
            AssetManager assets = cordova.getActivity().getAssets();

            FileOutputStream outStream = new FileOutputStream(file);
            InputStream inputStream    = assets.open(resPath);

            copyFile(inputStream, outStream);
            outStream.flush();
            outStream.close();
        } catch (Exception e) {
            System.err.println("Attachment asset not found: assets/" + resPath);
            e.printStackTrace();
        }

        return Uri.fromFile(file);
    }

    /**
     * The URI for a resource.
     *
     * @param {String} path
     *      The given relative path
     *
     * @return The URI pointing to the given path
     */
    private Uri getUriForResourcePath (String path) {
        String resPath   = path.replaceFirst("res://", "");
        String fileName  = resPath.substring(resPath.lastIndexOf('/') + 1);
        String resName   = fileName.substring(0, fileName.lastIndexOf('.'));
        String extension = resPath.substring(resPath.lastIndexOf('.'));
        String storage   = cordova.getActivity().getExternalCacheDir().toString() + STORAGE_FOLDER;

        int resId        = getResId(resPath);
        File file        = new File(storage, resName + extension);

        if (resId == 0) {
            System.err.println("Attachment resource not found: " + resPath);
        }

        new File(storage).mkdir();

        try {
            Resources res = cordova.getActivity().getResources();
            FileOutputStream outStream = new FileOutputStream(file);
            InputStream inputStream    = res.openRawResource(resId);

            copyFile(inputStream, outStream);
            outStream.flush();
            outStream.close();
        } catch (Exception e) {
            e.printStackTrace();
        }

        return Uri.fromFile(file);
    }

    /**
     * The URI for a base64 encoded content.
     *
     * @param {String} content
     *      The given base64 encoded content
     *
     * @return The URI including the given content
     */
    private Uri getUriForBase64Content (String content) {
        String resName = content.substring(content.indexOf(":") + 1, content.indexOf("//"));
        String resData = content.substring(content.indexOf("//") + 2);
        byte[] bytes   = Base64.decode(resData, 0);
        String storage = this.cordova.getActivity().getCacheDir() + STORAGE_FOLDER;
        File file      = new File(storage, resName);

        new File(storage).mkdir();

        try {
            FileOutputStream outStream = new FileOutputStream(file);

            outStream.write(bytes);
            outStream.flush();
            outStream.close();
        } catch (Exception e) {
            e.printStackTrace();
        }

        String pkgName = getPackageName();
        String uriPath = pkgName + AttachmentProvider.AUTHORITY + "/" + resName;

        return Uri.parse("content://" + uriPath);
    }

    /**
     * Writes an InputStream to an OutputStream
     *
     * @param {InputStream} in
     * @param {OutputStream} out
     *
     * @return void
     */
    private void copyFile (InputStream in, OutputStream out) throws IOException {
        byte[] buffer = new byte[1024];
        int read;

        while((read = in.read(buffer)) != -1){
            out.write(buffer, 0, read);
        }
    }

    /**
     * @return
     *      The resource ID for the given resource.
     */
    private int getResId (String resPath) {
        Resources res = cordova.getActivity().getResources();

        String pkgName  = getPackageName();
        String dirName  = resPath.substring(0, resPath.lastIndexOf('/'));
        String fileName = resPath.substring(resPath.lastIndexOf('/') + 1);
        String resName  = fileName.substring(0, fileName.lastIndexOf('.'));

        int resId = res.getIdentifier(resName, dirName, pkgName);

        return resId;
    }

    /**
     * @return
     *      The name for the package.
     */
    private String getPackageName () {
        return cordova.getActivity().getPackageName();
    }

    @Override
    public void onActivityResult(int requestCode, int resultCode, Intent intent) {
        super.onActivityResult(requestCode, resultCode, intent);

        command.success();
    }
}
