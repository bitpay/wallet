/*  
    Licensed under the Apache License, Version 2.0 (the "License");
    you may not use this file except in compliance with the License.
    You may obtain a copy of the License at
    
    http://www.apache.org/licenses/LICENSE-2.0
    
    Unless required by applicable law or agreed to in writing, software
    distributed under the License is distributed on an "AS IS" BASIS,
    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
    See the License for the specific language governing permissions and
    limitations under the License.
*/

using System;
using System.Net;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Documents;
using System.Windows.Ink;
using System.Windows.Input;
using System.Windows.Media;
using System.Windows.Media.Animation;
using System.Windows.Shapes;
using Microsoft.Phone.Info;
using System.Windows.Controls.Primitives;
using System.Diagnostics;
using System.Windows.Media.Imaging;

namespace WPCordovaClassLib.Cordova.Commands
{
    /// <summary>
    /// Listens for changes to the state of the battery on the device.
    /// Currently only the "isPlugged" parameter available via native APIs.
    /// </summary>
    public class SplashScreen : BaseCommand
    {
        private Popup popup;

        public SplashScreen()
        {
            Image SplashScreen = new Image();
            BitmapImage splash_image = new BitmapImage();
            splash_image.SetSource(Application.GetResourceStream(new Uri(@"SplashScreenImage.jpg", UriKind.Relative)).Stream);
            SplashScreen.Source = splash_image;

            // Instansiate the popup and set the Child property of Popup to SplashScreen
            this.popup = new Popup() {IsOpen = false, Child = SplashScreen };
            // Orient the popup accordingly
            this.popup.HorizontalAlignment = HorizontalAlignment.Stretch;
            this.popup.VerticalAlignment = VerticalAlignment.Center;
        }

        public void show(string options)
        {
            Deployment.Current.Dispatcher.BeginInvoke(() =>
            {
                this.popup.IsOpen = true;
            }); 
        }
        public void hide(string options)
        {
            Deployment.Current.Dispatcher.BeginInvoke(() =>
            {
                this.popup.IsOpen = false;
            });
        }
    }
}
