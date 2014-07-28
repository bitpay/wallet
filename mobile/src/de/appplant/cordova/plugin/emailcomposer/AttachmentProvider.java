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
import java.io.FileNotFoundException;

import android.content.ContentProvider;
import android.content.ContentValues;
import android.content.UriMatcher;
import android.database.Cursor;
import android.database.MatrixCursor;
import android.net.Uri;
import android.os.ParcelFileDescriptor;
import android.provider.MediaStore;
import android.webkit.MimeTypeMap;

public class AttachmentProvider extends ContentProvider {

    public static final String AUTHORITY = ".plugin.emailcomposer.attachmentprovider";

    private UriMatcher uriMatcher;

    @Override
    public boolean onCreate() {
        String pkgName = this.getContext().getPackageName();

        uriMatcher = new UriMatcher(UriMatcher.NO_MATCH);

        uriMatcher.addURI(pkgName + AUTHORITY, "*", 1);

        return true;
    }

    @Override
    public ParcelFileDescriptor openFile(Uri uri, String mode) throws FileNotFoundException {
        switch(uriMatcher.match(uri)) {
            case 1:
                String storage = getContext().getCacheDir() + EmailComposer.STORAGE_FOLDER;
                String path = storage + File.separator + uri.getLastPathSegment();

                File file = new File(path);
                ParcelFileDescriptor pfd = ParcelFileDescriptor.open(file, ParcelFileDescriptor.MODE_READ_ONLY);

                return pfd;
            default:
                throw new FileNotFoundException("Unsupported uri: " + uri.toString());
        }
    }

    @Override
    public int update(Uri arg0, ContentValues arg1, String arg2, String[] arg3) {
        return 0;
    }

    @Override
    public int delete(Uri arg0, String arg1, String[] arg2) {
        return 0;
    }

    @Override
    public Uri insert(Uri arg0, ContentValues arg1) {
        return null;
    }

    @Override
    public String getType(Uri arg0) {
        String fileExtension = MimeTypeMap.getFileExtensionFromUrl(arg0.getPath());
        String type = MimeTypeMap.getSingleton().getMimeTypeFromExtension(fileExtension);

        return type;
    }

    @Override
    public Cursor query(Uri uri, String[] projection, String selection, String[] selectionArgs, String sortOrder) {
        MatrixCursor result = new MatrixCursor(projection);
        Object[] row = new Object[projection.length];
        long fileSize = 0;

        String fileLocation = getContext().getCacheDir() + File.separator + uri.getLastPathSegment();
        File tempFile = new File(fileLocation);
        fileSize = tempFile.length();

        for (int i=0; i<projection.length; i++) {
            if (projection[i].compareToIgnoreCase(MediaStore.MediaColumns.DISPLAY_NAME) == 0) {
                row[i] = uri.getLastPathSegment();
            } else if (projection[i].compareToIgnoreCase(MediaStore.MediaColumns.SIZE) == 0) {
                row[i] = fileSize;
            }
        }

        result.addRow(row);
        return result;
    }

}
