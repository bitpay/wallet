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

using System;
using System.Linq;
using System.Runtime.Serialization;

namespace De.APPPlant.Cordova.Plugin.EmailComposer
{
    /// <summary>
    /// Represents email composer task options
    /// </summary>
    [DataContract]
    class Options
    {
        /// <summary>
        /// Represents the subject of the email
        /// </summary>
        [DataMember(IsRequired = false, Name = "subject")]
        public string Subject { get; set; }

        /// <summary>
        /// Represents the email body (could be HTML code, in this case set isHtml to true)
        /// </summary>
        [DataMember(IsRequired = false, Name = "body")]
        public string Body { get; set; }

        /// <summary>
        /// Indicats if the body is HTML or plain text
        /// </summary>
        [DataMember(IsRequired = false, Name = "isHtml")]
        public bool IsHtml { get; set; }

        /// <summary>
        /// Contains all the email addresses for TO field
        /// </summary>
        [DataMember(IsRequired = false, Name = "to")]
        public string[] To { get; set; }

        /// <summary>
        /// Contains all the email addresses for CC field
        /// </summary>
        [DataMember(IsRequired = false, Name = "cc")]
        public string[] Cc { get; set; }

        /// <summary>
        /// Contains all the email addresses for BCC field
        /// </summary>
        [DataMember(IsRequired = false, Name = "bcc")]
        public string[] Bcc { get; set; }

        /// <summary>
        /// Contains all full paths to the files you want to attach
        /// </summary>
        [DataMember(IsRequired = false, Name = "attachments")]
        public string[] Attachments { get; set; }
    }
}
