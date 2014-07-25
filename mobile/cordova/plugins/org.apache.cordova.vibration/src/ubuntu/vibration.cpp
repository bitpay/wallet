/*
 *
 * Copyright 2013 Canonical Ltd.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 *
*/

#include <QFeedbackHapticsEffect>
#include "vibration.h"

void Vibration::vibrate(int, int, int mills) {
    QFeedbackHapticsEffect *vibrate = new QFeedbackHapticsEffect;
    vibrate->setIntensity(1.0);
    vibrate->setDuration(mills);

    connect(vibrate, &QFeedbackHapticsEffect::stateChanged, [&]() {
        QFeedbackEffect *effect = qobject_cast<QFeedbackEffect *>(sender());
        if (!effect)
            return;
        if (effect->state() == QFeedbackEffect::Stopped)
            effect->deleteLater();
    });

    vibrate->start();
}

