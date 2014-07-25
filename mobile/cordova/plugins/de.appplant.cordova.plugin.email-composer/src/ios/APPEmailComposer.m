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

#import "APPEmailComposer.h"
#import "Cordova/NSData+Base64.h"
#import <MobileCoreServices/MobileCoreServices.h>

@interface APPEmailComposer (Private)

// Instantiates an email composer view
- (MFMailComposeViewController*) getDraftWithProperties:(NSDictionary*)properties;
// Displays the email draft
- (void) openDraft: (MFMailComposeViewController*)draft;
// Sets the subject of the email draft
- (void) setSubject:(NSString*)subject ofDraft:(MFMailComposeViewController*)draft;
// Sets the body of the email draft
- (void) setBody:(NSString*)body ofDraft:(MFMailComposeViewController*)draft isHTML:(BOOL)isHTML;
// Sets the recipients of the email draft
- (void) setToRecipients:(NSArray*)recipients ofDraft:(MFMailComposeViewController*)draft;
// Sets the CC recipients of the email draft
- (void) setCcRecipients:(NSArray*)ccRecipients ofDraft:(MFMailComposeViewController*)draft;
// Sets the BCC recipients of the email draft
- (void) setBccRecipients:(NSArray*)bccRecipients ofDraft:(MFMailComposeViewController*)draft;
// Sets the attachments of the email draft
- (void) setAttachments:(NSArray*)attatchments ofDraft:(MFMailComposeViewController*)draft;
// Delegate will be called after the mail composer did finish an action to dismiss the view
- (void) mailComposeController:(MFMailComposeViewController*)controller
           didFinishWithResult:(MFMailComposeResult)result error:(NSError*)error;
// Retrieves the mime type from the file extension
- (NSString*) getMimeTypeFromFileExtension:(NSString*)extension;
// Returns the data for a given (relative) attachments path
- (NSData*) getDataForAttachmentPath:(NSString*)path;
// Retrieves the attachments basename.
- (NSString*) getBasenameFromAttachmentPath:(NSString*)path;
// Retrieves the data for an absolute attachment path
- (NSData*) dataForAbsolutePath:(NSString*)path;
// Retrieves the data for a resource attachment path
- (NSData*) dataForResource:(NSString*)path;
// Retrieves the data for a asset path
- (NSData*) dataForAsset:(NSString*)path;
// Retrieves the data for a base64 encoded string
- (NSData*) dataFromBase64:(NSString*)base64String;
// Invokes the callback without any parameter
- (void) execCallback;

@end

@interface APPEmailComposer ()

@property (nonatomic, retain) CDVInvokedUrlCommand* command;

@end

@implementation APPEmailComposer

/**
 * Checks if the mail composer is able to send mails.
 *
 * @param callbackId
 *      The ID of the JS function to be called with the result
 */
- (void) isServiceAvailable:(CDVInvokedUrlCommand*)command
{
    bool canSendMail = [MFMailComposeViewController canSendMail];
    CDVPluginResult* result;

    result = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK
                                 messageAsBool:canSendMail];

    [self.commandDelegate sendPluginResult:result
                                callbackId:command.callbackId];
}

/**
 * Shows the email composer view with pre-filled data.
 *
 * @param {NSDictionary} properties
 *      The email properties like subject, body, attachments
 */
- (void) open:(CDVInvokedUrlCommand*)command
{
    NSDictionary* properties = [command.arguments objectAtIndex:0];
    MFMailComposeViewController* controller = [self getDraftWithProperties:
                                               properties];

    _command = command;

    if (!controller) {
        [self execCallback];

        return;
    }

    [self openDraft:controller];
    [self commandDelegate];
}

/**
 * Instantiates an email composer view.
 *
 * @param {NSDictionary} properties
 *      The email properties like subject, body, attachments
 *
 * @return {MFMailComposeViewController}
 */
- (MFMailComposeViewController*) getDraftWithProperties:(NSDictionary*)properties
{
    // Falls das Gerät kein Email Interface unterstützt
    if (![MFMailComposeViewController canSendMail]) {
        return NULL;
    }

    BOOL isHTML = [[properties objectForKey:@"isHtml"] boolValue];

    MFMailComposeViewController* draft = [[MFMailComposeViewController alloc]
                                          init];

    draft.mailComposeDelegate = self;

    // Subject
    [self setSubject:[properties objectForKey:@"subject"] ofDraft:draft];
    // Body (as HTML)
    [self setBody:[properties objectForKey:@"body"] ofDraft:draft isHTML:isHTML];
    // Recipients
    [self setToRecipients:[properties objectForKey:@"to"] ofDraft:draft];
    // CC Recipients
    [self setCcRecipients:[properties objectForKey:@"cc"] ofDraft:draft];
    // BCC Recipients
    [self setBccRecipients:[properties objectForKey:@"bcc"] ofDraft:draft];
    // Attachments
    [self setAttachments:[properties objectForKey:@"attachments"] ofDraft:draft];

    return draft;
}

/**
 * Displays the email draft.
 *
 * @param {MFMailComposeViewController} draft
 *      The email composer view
 */
- (void) openDraft:(MFMailComposeViewController*)draft
{
    [self.commandDelegate runInBackground:^{
        [self.viewController presentViewController:draft
                                          animated:YES completion:NULL];
    }];
}

/**
 * Sets the subject of the email draft.
 *
 * @param {NSString} subject
 *      The subject of the email
 * @param {MFMailComposeViewController} draft
 *      The email composer view
 */
- (void) setSubject:(NSString*)subject
            ofDraft:(MFMailComposeViewController*)draft
{
    [draft setSubject:subject];
}

/**
 * Sets the body of the email draft.
 *
 * @param {NSString} body
 *      The body of the email
 * @param {BOOL} isHTML
 *      Indicates if the body is an HTML encoded string
 * @param {MFMailComposeViewController} draft
 *      The email composer view
 */
- (void) setBody:(NSString*)body ofDraft:(MFMailComposeViewController*)draft
          isHTML:(BOOL)isHTML
{
    [draft setMessageBody:body isHTML:isHTML];
}

/**
 * Sets the recipients of the email draft.
 *
 * @param {NSArray} recipients
 *      The recipients of the email
 * @param {MFMailComposeViewController} draft
 *      The email composer view
 */
- (void) setToRecipients:(NSArray*)recipients
                 ofDraft:(MFMailComposeViewController*)draft
{
    [draft setToRecipients:recipients];
}

/**
 * Sets the CC recipients of the email draft.
 *
 * @param {NSArray} ccRecipients
 *      The CC recipients of the email
 * @param {MFMailComposeViewController} draft
 *      The email composer view
 */
- (void) setCcRecipients:(NSArray*)ccRecipients
                 ofDraft:(MFMailComposeViewController*)draft
{
    [draft setCcRecipients:ccRecipients];
}

/**
 * Sets the BCC recipients of the email draft.
 *
 * @param {NSArray} bccRecipients
 *      The BCC recipients of the email
 * @param {MFMailComposeViewController} draft
 *      The email composer view
 */
- (void) setBccRecipients:(NSArray*)bccRecipients
                  ofDraft:(MFMailComposeViewController*)draft
{
    [draft setBccRecipients:bccRecipients];
}

/**
 * Sets the attachments of the email draft.
 *
 * @param {NSArray} attachments
 *      The attachments of the email
 * @param {MFMailComposeViewController} draft
 *      The email composer view
 */
- (void) setAttachments:(NSArray*)attatchments
                ofDraft:(MFMailComposeViewController*)draft
{
    if (attatchments)
    {
        for (NSString* path in attatchments)
        {
            NSData* data = [self getDataForAttachmentPath:path];

            NSString* basename = [self getBasenameFromAttachmentPath:path];
            NSString* pathExt  = [basename pathExtension];
            NSString* fileName = [basename pathComponents].lastObject;
            NSString* mimeType = [self getMimeTypeFromFileExtension:pathExt];

            [draft addAttachmentData:data mimeType:mimeType fileName:fileName];
        }
    }
}

/**
 * Delegate will be called after the mail composer did finish an action
 * to dismiss the view.
 */
- (void) mailComposeController:(MFMailComposeViewController*)controller
           didFinishWithResult:(MFMailComposeResult)result
                         error:(NSError*)error
{
    [controller dismissViewControllerAnimated:YES completion:nil];

    [self execCallback];
}

/**
 * Retrieves the mime type from the file extension.
 *
 * @param {NSString} extension
 *      The file's extension
 */
- (NSString*) getMimeTypeFromFileExtension:(NSString*)extension
{
    if (!extension) {
        return nil;
    }

    // Get the UTI from the file's extension
    CFStringRef ext = (CFStringRef)CFBridgingRetain(extension);
    CFStringRef type = UTTypeCreatePreferredIdentifierForTag(kUTTagClassFilenameExtension, ext, NULL);

    // Converting UTI to a mime type
    return (NSString*)CFBridgingRelease(UTTypeCopyPreferredTagWithClass(type, kUTTagClassMIMEType));
}

/**
 * Retrieves the attachments basename.
 *
 * @param {NSString} path
 *      The file path or bas64 data of the attachment
 */
- (NSString*) getBasenameFromAttachmentPath:(NSString*)path
{
    if ([path hasPrefix:@"base64:"])
    {
        NSString* pathWithoutPrefix;

        pathWithoutPrefix = [path stringByReplacingOccurrencesOfString:@"base64:"
                                                            withString:@""];

        return [pathWithoutPrefix substringToIndex:
                [pathWithoutPrefix rangeOfString:@"//"].location];
    }

    return path;

}

/**
 * Returns the data for a given (relative) attachment path.
 *
 * @param {NSString} path
 *      An absolute/relative path or the base64 data
 */
- (NSData*) getDataForAttachmentPath:(NSString*)path
{
    if ([path hasPrefix:@"file:"])
    {
        return [self dataForAbsolutePath:path];
    }
    else if ([path hasPrefix:@"res:"])
    {
        return [self dataForResource:path];
    }
    else if ([path hasPrefix:@"www:"])
    {
        return [self dataForAsset:path];
    }
    else if ([path hasPrefix:@"base64:"])
    {
        return [self dataFromBase64:path];
    }

    NSFileManager* fileManager = [NSFileManager defaultManager];

    if (![fileManager fileExistsAtPath:path]){
        NSLog(@"Attachment path not found: %@", path);
    }

    return [fileManager contentsAtPath:path];
}

/**
 * Retrieves the data for an absolute attachment path.
 *
 * @param {NSString} path
 *      An absolute file path
 */
- (NSData*) dataForAbsolutePath:(NSString*)path
{
    NSFileManager* fileManager = [NSFileManager defaultManager];
    NSString* absPath;

    if (![path hasPrefix:@"file:///"]) {
        NSBundle* mainBundle = [NSBundle mainBundle];
        NSString* bundlePath = [[mainBundle bundlePath]
                                stringByDeletingLastPathComponent];

        NSString* relDocPath = [bundlePath stringByAppendingString:@"/Documents/"];

        path = [path stringByReplacingOccurrencesOfString:@"file://"
                                                  withString:relDocPath];
    }

    absPath = [path stringByReplacingOccurrencesOfString:@"file://"
                                              withString:@""];

    if (![fileManager fileExistsAtPath:absPath]){
        NSLog(@"Attachment path not found: %@", absPath);
    }

    NSData* data = [fileManager contentsAtPath:absPath];

    return data;
}

/**
 * Retrieves the data for a resource path.
 *
 * @param {NSString} path
 *      A relative file path
 */
- (NSData*) dataForResource:(NSString*)path
{
    NSFileManager* fileManager = [NSFileManager defaultManager];
    NSString* absPath;

    NSBundle* mainBundle = [NSBundle mainBundle];
    NSString* bundlePath = [[mainBundle bundlePath]
                            stringByAppendingString:@"/"];

    absPath = [path pathComponents].lastObject;

    absPath = [bundlePath stringByAppendingString:absPath];

    if (![fileManager fileExistsAtPath:absPath]){
        NSLog(@"Attachment path not found: %@", absPath);
    }

    NSData* data = [fileManager contentsAtPath:absPath];

    return data;
}

/**
 * Retrieves the data for a asset path.
 *
 * @param {NSString} path
 *      A relative www file path
 */
- (NSData*) dataForAsset:(NSString*)path
{
    NSFileManager* fileManager = [NSFileManager defaultManager];
    NSString* absPath;

    NSBundle* mainBundle = [NSBundle mainBundle];
    NSString* bundlePath = [[mainBundle bundlePath]
                            stringByAppendingString:@"/"];

    absPath = [path stringByReplacingOccurrencesOfString:@"www:/"
                                              withString:@"www"];

    absPath = [bundlePath stringByAppendingString:absPath];

    if (![fileManager fileExistsAtPath:absPath]){
        NSLog(@"Attachment path not found: %@", absPath);
    }

    NSData* data = [fileManager contentsAtPath:absPath];

    return data;
}

/**
 * Retrieves the data for a base64 encoded string.
 *
 * @param {NSString} base64String
 *      Base64 encoded string
 */
- (NSData*) dataFromBase64:(NSString*)base64String
{
    NSUInteger length = [base64String length];
    NSRegularExpression *regex;
    NSString *dataString;

    regex = [NSRegularExpression regularExpressionWithPattern:@"^base64:[^/]+.."
                                                      options:NSRegularExpressionCaseInsensitive
                                                        error:Nil];

    dataString = [regex stringByReplacingMatchesInString:base64String
                                                 options:0
                                                   range:NSMakeRange(0, length)
                                            withTemplate:@""];

    NSData* data = [NSData dataFromBase64String:dataString];

    return data;
}

/**
 * Invokes the callback without any parameter.
 */
- (void) execCallback
{
    CDVPluginResult *result = [CDVPluginResult
                               resultWithStatus:CDVCommandStatus_OK];

    [self.commandDelegate sendPluginResult:result
                                callbackId:_command.callbackId];
}

@end